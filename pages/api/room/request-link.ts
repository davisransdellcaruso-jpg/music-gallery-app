// POST { email, lang } → adds the email to the supporters list if it's new, then emails a sign-in link.
// Always answers "ok" so the form never reveals anything about the list.
import type { NextApiRequest, NextApiResponse } from "next";
import { LINK_MAX_SECONDS, findSupporter, makeToken, parseBody, siteUrl } from "../../../lib/room";

const COPY = {
  en: {
    subject: "Your way into the listening room",
    hi: "Here's your private link to the listening room.",
    button: "Enter the listening room",
    note: "This link stays open as long as you stop by at least once every 30 days. If you didn't ask for it, you can ignore this email.",
  },
  es: {
    subject: "Tu entrada a la sala de escucha",
    hi: "Aquí tienes tu enlace privado a la sala de escucha.",
    button: "Entrar a la sala de escucha",
    note: "Este enlace sigue abierto mientras entres al menos una vez cada 30 días. Si no lo pediste, puedes ignorar este correo.",
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const body = parseBody(req);
  const email = String(body.email || "").trim();
  const lang = body.lang === "es" ? "es" : "en";
  if (!email.includes("@") || email.length > 254) return res.status(400).json({ error: "invalid" });

  const stored = await findSupporter(email);
  if (stored) {
    const link = `${siteUrl()}/api/room/verify?t=${encodeURIComponent(makeToken(stored, "link", LINK_MAX_SECONDS))}`;
    const t = COPY[lang];
    const html = `
      <div style="font-family:Georgia,serif;background:#1c1410;color:#efe6d8;padding:40px 24px;text-align:center">
        <p style="font-size:18px;margin:0 0 28px">${t.hi}</p>
        <a href="${link}" style="display:inline-block;background:#c9a45c;color:#1c1410;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:bold">${t.button}</a>
        <p style="font-size:13px;color:#a8998a;margin:28px 0 0">${t.note}</p>
        <p style="font-size:13px;color:#a8998a;margin:8px 0 0">— Davis</p>
      </div>`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Davis Caruso <music@daviscaruso.com>",
        to: stored,
        reply_to: process.env.RESEND_REPLY_TO || undefined,
        subject: t.subject,
        html,
      }),
    });
    if (!r.ok) console.error("room email failed", r.status, await r.text());
  }
  return res.status(200).json({ ok: true });
}