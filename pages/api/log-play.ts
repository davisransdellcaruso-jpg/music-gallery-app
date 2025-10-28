import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { track_id, user_id } = req.body;

    // ✅ safer IP detection with localhost fallback
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress ||
      "8.8.8.8"; // fallback ensures data when testing locally

    const ip_hash = crypto.createHash("sha256").update(ip).digest("hex");

    // 🌍 Use ipwho.is for reliable free IP lookups
    const geoRes = await fetch(`https://ipwho.is/${ip}`);
    const geo = await geoRes.json();

    // ✅ Insert with lat/long + null-safe fields
    await supabase.from("listens").insert({
      track_id,
      user_id,
      city: geo.city || null,
      region: geo.region || null,
      country: geo.country || null,
      latitude: geo.latitude || null,
      longitude: geo.longitude || null,
      ip_hash,
    });

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("log-play error:", e);
    res.status(500).json({ success: false });
  }
}
