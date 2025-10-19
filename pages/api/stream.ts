// pages/api/stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string // server-side key only
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { path } = req.query; // e.g. ?path=albums/thefool/sweaty-man.mp3
    if (!path) return res.status(400).send("Missing path");

    // ✅ Bucket name is "tracks"
    const BUCKET_NAME = "tracks";

    // Download file from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(String(path));

    if (error || !data) {
      console.error("Error downloading file:", error?.message);
      return res.status(404).send("File not found");
    }

    // Stream the file back to the browser
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Accept-Ranges", "bytes");

    data.pipe(res);
  } catch (err: any) {
    console.error("Stream error:", err.message);
    res.status(500).send("Internal server error");
  }
}
