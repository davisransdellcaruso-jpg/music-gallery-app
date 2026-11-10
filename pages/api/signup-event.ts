// pages/api/signup-event.ts
// Counts the browser-side steps of the email signup: popup shown, popup
// dismissed, "Get the song" button tapped. "submitted" is recorded by
// /api/claim-song and "confirmed" by /api/verify, so those two only count
// when an email was really saved or really confirmed.
import type { NextApiRequest, NextApiResponse } from "next";
import { recordSignupEvent } from "../../lib/signupEventsServer";

const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|monitor/i;
const FROM_BROWSER = new Set(["shown", "dismissed", "button"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const ua = String(req.headers["user-agent"] ?? "");
  const event = String(req.body?.event ?? "");
  if (!ua || BOT.test(ua) || !FROM_BROWSER.has(event)) {
    return res.status(204).end();
  }

  await recordSignupEvent({
    event,
    source: req.body?.source,
    visitorId: req.body?.visitorId,
    page: req.body?.page,
    country: (req.headers["x-vercel-ip-country"] as string) || null,
  });

  return res.status(204).end();
}
