// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import brevo from "@/lib/brevo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { to, subject, htmlContent } = req.body;

    // Build the email object using Brevo's SDK
    const sendSmtpEmail = {
      sender: { email: "you@yourdomain.com", name: "wavis" },
      to: [{ email: to }],
      subject,
      htmlContent,
    };

    // Use Brevo's transactional email method
    const response = await brevo.sendTransacEmail(sendSmtpEmail);

    return res.status(200).json({ success: true, data: response });
  } catch (err: any) {
    console.error(err.response?.body || err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
