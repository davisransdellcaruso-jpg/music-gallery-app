// Place at: pages/api/visit.ts
//
// Called once a day per browser by <ListenerPing />. Reads the visitor's
// approximate location from Vercel's headers and records an anonymous
// listener dot. Nothing is recorded in local dev (Vercel adds no headers there).

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|monitor/i;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function header(req: NextApiRequest, name: string): string {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Skip search engines, link previews and other bots
  const ua = header(req, "user-agent");
  if (!ua || BOT.test(ua)) return res.status(204).end();

  const visitorId = req.body?.visitorId;
  if (typeof visitorId !== "string" || !UUID.test(visitorId)) {
    return res.status(400).end();
  }

  const lat = parseFloat(header(req, "x-vercel-ip-latitude"));
  const lng = parseFloat(header(req, "x-vercel-ip-longitude"));
  const country = header(req, "x-vercel-ip-country") || null;
  const region = header(req, "x-vercel-ip-country-region") || null;
  let city: string | null = null;
  try {
    // Vercel URL-encodes city names (e.g. "S%C3%A3o%20Paulo")
    city = decodeURIComponent(header(req, "x-vercel-ip-city")) || null;
  } catch {
    city = null;
  }

  // No location available (local dev, VPNs, etc.): quietly skip
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(204).end();
  }

  const { error } = await supabase.rpc("record_visit", {
    p_visitor_id: visitorId,
    p_lat: lat,
    p_lng: lng,
    p_country: country,
    p_city: city,
    p_region: region,
  });

  if (error) console.error("record_visit failed:", error.message);
  return res.status(204).end();
}