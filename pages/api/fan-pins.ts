// Place at: pages/api/fan-pins.ts   (your site uses the Pages Router)
//
// Uses your existing lib/supabaseAdmin (the same client claim-song.ts uses),
// so there are no new required env vars.
// Optional: IP_HASH_SALT (any long random string) makes the stored IP hashes
// harder to reverse.

import type { NextApiRequest, NextApiResponse } from "next";
import { createHash, randomBytes } from "crypto";
import { MOODS } from "../../components/moods";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

const MAX_PINS_PER_HOUR_PER_IP = 3;

// The browser maps these codes to English/Spanish messages.
type Code = "name" | "city" | "story" | "mood" | "links" | "rate" | "server" | "invalid";

function clean(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const fail = (status: number, code: Code, error: string) =>
    res.status(status).json({ error, code });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(405, "invalid", "Method not allowed.");
  }

  const body: any = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: real people never fill this hidden field. Pretend success.
  if (body.website) return res.status(200).json({ ok: true, id: null });

  const display_name = clean(body.display_name, 40);
  const city = clean(body.city, 80);
  const region = clean(body.region, 80) || null;
  const country = clean(body.country, 80) || null;
  const story = clean(body.story, 200); // the lyrics they typed
  const mood = typeof body.mood === "string" ? body.mood : "";
  const lat = Number(body.latitude);
  const lng = Number(body.longitude);

  if (!display_name) return fail(400, "name", "Please add a first name or nickname.");
  if (
    !city ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return fail(400, "city", "Please pick your city from the suggestions.");
  }
  if (story.length < 2) {
    return fail(400, "story", "Please share a few words of lyrics.");
  }
  if (!MOODS.includes(mood)) {
    return fail(400, "mood", "Please pick an emoji.");
  }
  if (/(https?:\/\/|www\.|\S+@\S+\.\S+)/i.test(`${display_name} ${story}`)) {
    return fail(400, "links", "Please leave links and email addresses out.");
  }

  // Rate limit by salted IP hash (stored only for this purpose)
  const fwd = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : fwd ?? "").split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";
  const ip_hash = createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? ""))
    .digest("hex");

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("fan_pins")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip_hash)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_PINS_PER_HOUR_PER_IP) {
    return fail(429, "rate", "Too many submissions. Please try again later.");
  }

  // A secret that lets this fan's device change their mood later.
  // Only its hash is stored; the real token is sent back once.
  const token = randomBytes(24).toString("hex");
  const edit_token_hash = createHash("sha256").update(token).digest("hex");

  const { data, error } = await supabaseAdmin
    .from("fan_pins")
    .insert({
      display_name,
      city,
      region,
      country,
      // ~1 km precision: city-level only, never a street address
      latitude: round2(lat),
      longitude: round2(lng),
      story,
      mood,
      approved: false,
      ip_hash,
      edit_token_hash,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("fan-pins insert failed:", error);
    return fail(500, "server", "Couldn't save your pin.");
  }

  return res.status(200).json({ ok: true, id: data.id, token });
}