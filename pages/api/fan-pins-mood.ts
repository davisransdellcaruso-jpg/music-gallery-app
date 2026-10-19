// Place at: pages/api/fan-pins-mood.ts
//
// An approved fan's device sends {id, token, mood} to change the emoji on
// their own pin. The token was handed out once when they added themselves;
// only its hash is stored. Changing mood at most once every 6 hours.

import type { NextApiRequest, NextApiResponse } from "next";
import { createHash, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { MOODS } from "../../components/moods";

const COOLDOWN_MS = 6 * 60 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const fail = (status: number, code: string) =>
    res.status(status).json({ error: code, code });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(405, "invalid");
  }

  const body: any = req.body && typeof req.body === "object" ? req.body : {};
  const id = typeof body.id === "string" ? body.id : "";
  const token = typeof body.token === "string" ? body.token : "";
  const mood = typeof body.mood === "string" ? body.mood : "";

  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{48}$/.test(token)) {
    return fail(400, "invalid");
  }
  if (!MOODS.includes(mood)) return fail(400, "mood");

  const { data: row, error } = await supabaseAdmin
    .from("fan_pins")
    .select("edit_token_hash, approved, mood_updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("fan-pins-mood lookup failed:", error);
    return fail(500, "server");
  }
  if (!row || !row.edit_token_hash) return fail(403, "forbidden");

  const given = Uint8Array.from(createHash("sha256").update(token).digest());
  const stored = Uint8Array.from(Buffer.from(row.edit_token_hash, "hex"));
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) {
    return fail(403, "forbidden");
  }
  if (!row.approved) return fail(403, "pending");

  if (
    row.mood_updated_at &&
    Date.now() - new Date(row.mood_updated_at).getTime() < COOLDOWN_MS
  ) {
    return fail(429, "rate");
  }

  const { error: upErr } = await supabaseAdmin
    .from("fan_pins")
    .update({ mood, mood_updated_at: new Date().toISOString() })
    .eq("id", id);

  if (upErr) {
    console.error("fan-pins-mood update failed:", upErr);
    return fail(500, "server");
  }
  return res.status(200).json({ ok: true });
}