// GET → listening analytics for /studio. Only works for the STUDIO_EMAIL account.
import type { NextApiRequest, NextApiResponse } from "next";
import { getSupporter, isStudio, roomDb } from "../../../lib/room";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  const email = await getSupporter(req);
  if (!email) return res.status(401).json({ error: "signin" });
  if (!isStudio(email)) return res.status(403).json({ error: "studio only" });

  const [{ data: tracks }, { data: plays }, { data: supporters }] = await Promise.all([
    roomDb.from("room_tracks").select("id, title, sort_order, is_live").order("sort_order"),
    roomDb
      .from("room_plays")
      .select("track_id, email, seconds_listened, completed, played_at")
      .order("played_at", { ascending: false })
      .limit(20000),
    roomDb.from("supporters").select("email, name"),
  ]);

  const studio = (process.env.STUDIO_EMAIL || "").toLowerCase();
  // Leave your own test listens out of the numbers. Plays under 5 seconds are treated as skips.
  const real = (plays || []).filter((p) => p.email.toLowerCase() !== studio && p.seconds_listened >= 5);
  const titleOf = new Map((tracks || []).map((t) => [t.id, t.title]));
  const nameOf = new Map((supporters || []).map((s) => [s.email, s.name]));

  const byTrack = (tracks || []).map((t) => {
    const mine = real.filter((p) => p.track_id === t.id);
    return {
      id: t.id,
      title: t.title,
      live: t.is_live,
      plays: mine.length,
      listeners: new Set(mine.map((p) => p.email)).size,
      completions: mine.filter((p) => p.completed).length,
      minutes: Math.round(mine.reduce((s, p) => s + p.seconds_listened, 0) / 60),
    };
  });
  byTrack.sort((a, b) => b.plays - a.plays);

  const people = new Map<string, { email: string; name: string | null; plays: number; minutes: number; last: string }>();
  for (const p of real) {
    const row = people.get(p.email) || { email: p.email, name: nameOf.get(p.email) || null, plays: 0, minutes: 0, last: p.played_at };
    row.plays += 1;
    row.minutes += p.seconds_listened / 60;
    if (p.played_at > row.last) row.last = p.played_at;
    people.set(p.email, row);
  }
  const bySupporter = Array.from(people.values())
    .map((r) => ({ ...r, minutes: Math.round(r.minutes) }))
    .sort((a, b) => b.minutes - a.minutes);

  return res.json({
    totals: {
      supporters: (supporters || []).length,
      activeListeners: people.size,
      plays: real.length,
      minutes: Math.round(real.reduce((s, p) => s + p.seconds_listened, 0) / 60),
    },
    byTrack,
    bySupporter,
    recent: real.slice(0, 25).map((p) => ({
      title: titleOf.get(p.track_id) || "—",
      who: nameOf.get(p.email) || p.email,
      seconds: p.seconds_listened,
      completed: p.completed,
      at: p.played_at,
    })),
  });
}
