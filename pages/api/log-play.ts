import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { track_id, user_id } = req.body;
    if (!track_id) {
      return res.status(400).json({ error: "Missing track_id" });
    }

    // ✅ Detect IP (use first IP in case of proxy)
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "8.8.8.8"; // fallback for localhost/dev

    const ip_hash = crypto.createHash("sha256").update(ip).digest("hex");

    // 🌍 Reliable free IP geolocation
    const geoRes = await fetch(`https://ipwho.is/${ip}`);
    const geo = (await geoRes.json()) || {};

    // ✅ Defensive fallback for missing fields
    const city = geo.city ?? null;
    const region = geo.region ?? null;
    const country = geo.country ?? null;
    const latitude = geo.latitude ?? null;
    const longitude = geo.longitude ?? null;

    // 🪄 Insert row into Supabase
    const { error } = await supabase.from("listens").insert({
      track_id,
      user_id: user_id ?? null,
      city,
      region,
      country,
      latitude,
      longitude,
      ip_hash,
    });

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("log-play error:", e);
    res.status(500).json({ success: false, error: "Server error" });
  }
}
