// Sends email through Resend's REST API (no extra package needed).
// If you already use another provider, replace the body of this one function.

// Where replies to site emails go. Pass `replyTo` to override for a single email.
const DEFAULT_REPLY_TO = "wavis123@gmail.com";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM, // e.g. "Davis Caruso <hello@daviscaruso.com>"
      to: opts.to,
      reply_to: opts.replyTo || DEFAULT_REPLY_TO,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
  }
}