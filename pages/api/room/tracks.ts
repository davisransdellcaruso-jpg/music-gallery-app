// GET → the live tracks with short-lived private links to the FLAC files (supporters only).
import type { NextApiRequest, NextApiResponse } from "next";
import { BUCKET, getSupporter, isStudio, roomDb } from "../../../lib/room";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  const email = await getSupporter(req);
  if (!email) return res.status(401).json({ error: "signin" });

  const { data: tracks, error } = await roomDb
    .from("room_tracks")
    .select("id, title, note, file_path, sort_order")
    .eq("is_live", true)
    .order("sort_order", { ascending: true })
    .order("file_path", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  if (!tracks?.length) return res.json({ tracks: [], studio: isStudio(email) });

  const { data: signed, error: signError } = await roomDb.storage
    .from(BUCKET)
    .createSignedUrls(tracks.map((t) => t.file_path), 60 * 60 * 3);
  if (signError) return res.status(500).json({ error: signError.message });

  const urlFor = new Map((signed || []).map((s) => [s.path, s.signedUrl]));
  return res.json({
    studio: isStudio(email),
    tracks: tracks
      .map((t) => ({ id: t.id, title: t.title, note: t.note, url: urlFor.get(t.file_path) || null }))
      .filter((t) => t.url),
  });
}
