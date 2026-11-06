import type { NextApiRequest, NextApiResponse } from "next";
import { sessionCookie } from "../../../lib/room";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Set-Cookie", sessionCookie("", 0));
  res.redirect(302, "/room");
}
