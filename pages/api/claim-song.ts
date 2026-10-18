// pages/api/claim-song.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { sendEmail } from "../../lib/sendEmail";
import { SONGS } from "../../lib/songs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_MS = 60_000;

type Lang = "en" | "es";

// Confirmation email wording, per language
const EMAIL_COPY: Record<
  Lang,
  {
    subject: string;
    heading: string;
    body: string;
    button: string;
    ignore: string;
  }
> = {
  en: {
    subject: "Your unreleased song from Davis Caruso",
    heading: "Welcome to la famiglia",
    body: "Confirm your email to get your unreleased song",
    button: "GET MY SONG",
    ignore: "If you didn't ask for this, you can ignore this message.",
  },
  es: {
    subject: "Tu canción inédita de Davis Caruso",
    heading: "Te doy la bienvenida a la famiglia",
    body: "Confirma tu correo para recibir tu canción inédita",
    button: "QUIERO MI CANCIÓN",
    ignore: "Si no lo solicitaste, puedes ignorar este mensaje.",
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const location = String(req.body?.location || "").trim() || null;
  // Only ever "es" or "en" (anything else falls back to English)
  const lang: Lang = req.body?.lang === "es" ? "es" : "en";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email.", code: "email" });
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("mailing_list")
    .select("email, token_sent_at, song_index")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error(lookupError);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again.", code: "server" });
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
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again.", code: "server" });
  }

  const siteUrl = (process.env.SITE_URL || "https://daviscaruso.com").replace(
    /\/$/,
    ""
  );
  // lang rides along in the link so the confirm page (and the map after it)
  // stay in the same language as the email
  const confirmUrl = `${siteUrl}/api/verify?token=${token}&lang=${lang}`;
  const c = EMAIL_COPY[lang];

  try {
    await sendEmail({
      to: email,
      subject: c.subject,
      text: `${c.heading}.\n\n${c.body}:\n${confirmUrl}\n\n${c.ignore}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px;color:#715a99;background:#fbf5f0;border:1px solid #d4ad56;text-align:center">
          <h2 style="font-style:italic;margin:0 0 12px">${c.heading}</h2>
          <p style="line-height:1.6;margin:0 0 24px">${c.body}.</p>
          <a href="${confirmUrl}" style="display:inline-block;padding:14px 22px;background:#8068a7;color:#fffaf7;text-decoration:none;letter-spacing:0.15em;font-size:14px">${c.button}</a>
          <p style="font-size:12px;opacity:0.75;margin:24px 0 0">${c.ignore}</p>
        </div>`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Couldn't send the email. Please try again.",
      code: "send",
    });
  }

  return res.status(200).json({ ok: true });
}