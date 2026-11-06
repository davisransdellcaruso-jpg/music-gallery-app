// POST { trackId, playId?, seconds, completed } → starts or updates one listen.
// The first call (no playId) creates the row and returns its id; later calls update it.
import type { NextApiRequest, NextApiResponse } from "next";
import { getSupporter, parseBody, roomDb } from "../../../lib/room";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const email = await getSupporter(req);
  if (!email) return res.status(401).json({ error: "signin" });

  const body = parseBody(req);
  const seconds = Math.max(0, Math.min(7200, Math.round(Number(body.seconds) || 0)));
  const completed = body.completed === true;

  if (body.playId) {
    const { error } = await roomDb
      .from("room_plays")
      .update({ seconds_listened: seconds, completed })
      .eq("id", String(body.playId))
      .eq("email", email);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ playId: body.playId });
  }

  if (!body.trackId) return res.status(400).json({ error: "trackId" });
  const { data, error } = await roomDb
    .from("room_plays")
    .insert({ track_id: String(body.trackId), email, seconds_listened: seconds, completed })
    .select("id")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ playId: data.id });
}
