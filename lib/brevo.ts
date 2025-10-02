// lib/brevo.ts
export async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
}: {
  to: string;
  subject: string;
  htmlContent: string;
}) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    throw new Error("Missing BREVO_API_KEY");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: "you@yourdomain.com", name: "wavis" }, // ⚠️ must be a verified sender in Brevo
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Brevo API error: ${err}`);
  }

  return response.json();
}
