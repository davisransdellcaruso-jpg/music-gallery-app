// GET ?t=<link token> → sets a 90-day session cookie and sends the supporter into /room.
import type { NextApiRequest, NextApiResponse } from "next";
import { findSupporter, makeToken, readToken, sessionCookie } from "../../../lib/room";

const NINETY_DAYS = 60 * 60 * 24 * 90;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const email = readToken(String(req.query.t || ""), "link");
  const stored = email ? await findSupporter(email) : null;
  if (!stored) {
    res.redirect(302, "/room?expired=1");
    return;
  }
  res.setHeader("Set-Cookie", sessionCookie(makeToken(stored, "session", NINETY_DAYS), NINETY_DAYS));
  res.redirect(302, "/room");
}
