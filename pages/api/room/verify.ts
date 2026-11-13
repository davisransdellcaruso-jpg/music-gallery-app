// GET ?t=<link token> → signs the supporter in and sends them into /room.
// The link keeps working as long as they've been in the room within the last 30 days.
import type { NextApiRequest, NextApiResponse } from "next";
import { findSupporter, linkStillOpen, readTokenFull, touchSupporter } from "../../../lib/room";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const link = readTokenFull(String(req.query.t || ""), "link");
  const stored = link ? await findSupporter(link.email) : null;
  if (!link || !stored || !(await linkStillOpen(stored, link.issued))) {
    res.redirect(302, "/room?expired=1");
    return;
  }
  await touchSupporter(res, stored);
  res.redirect(302, "/room");
}
