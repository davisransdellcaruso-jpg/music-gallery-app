import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { sendEmail } from "../../lib/sendEmail";
import { SONGS } from "../../lib/songs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_MS = 60_000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const location = String(req.body?.location || "").trim() || null;

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: "Please enter a valid email." });
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("mailing_list")
    .select("email, token_sent_at, song_index")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error(lookupError);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }

  // Don't let anyone spam an inbox: one email per minute per address.
  // Respond the same way so we never reveal who is already on the list.
  if (
    existing?.token_sent_at &&
    Date.now() - new Date(existing.token_sent_at).getTime() < RESEND_COOLDOWN_MS
  ) {
    return res.status(200).json({ ok: true });
  }

  const token = randomUUID();
  const songIndex =
    existing?.song_index ?? Math.floor(Math.random() * SONGS.length);
  const now = new Date().toISOString();

  const fields = {
    verify_token: token,
    token_sent_at: now,
    song_index: songIndex,
  };

  const { error: saveError } = existing
    ? await supabaseAdmin.from("mailing_list").update(fields).eq("email", email)
    : await supabaseAdmin.from("mailing_list").insert([
        { email, location, location_detected: location, ...fields },
      ]);

  if (saveError) {
    console.error(saveError);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }

  const siteUrl = (process.env.SITE_URL || "https://daviscaruso.com").replace(/\/$/, "");
  const confirmUrl = `${siteUrl}/api/verify?token=${token}`;

  try {
    await sendEmail({
      to: email,
      subject: "Your unreleased song from Davis Caruso",
      text: `Welcome to la famiglia.\n\nConfirm your email to get your unreleased song:\n${confirmUrl}\n\nIf you didn't ask for this, you can ignore this message.`,
      html: `
        <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#715a99;background:#fbf5f0;border:1px solid #d4ad56;text-align:center">
          <h2 style="font-style:italic;margin:0 0 12px">Welcome to la famiglia</h2>
          <p style="line-height:1.6;margin:0 0 24px">Confirm your email to get your unreleased song.</p>
          <a href="${confirmUrl}" style="display:inline-block;padding:14px 22px;background:#8068a7;color:#fffaf7;text-decoration:none;letter-spacing:0.15em;font-size:14px">GET MY SONG</a>
          <p style="font-size:12px;opacity:0.75;margin:24px 0 0">If you didn't ask for this, you can ignore this message.</p>
        </div>`,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Couldn't send the email. Please try again." });
  }

  return res.status(200).json({ ok: true });
}