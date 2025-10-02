// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import brevo from "@/lib/brevo";
import { SendSmtpEmail } from "sib-api-v3-typescript";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { to, subject, htmlContent } = req.body;

    if (!to || !subject || !htmlContent) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Build the email object
    const email = new SendSmtpEmail();
    email.sender = { email: "you@yourdomain.com", name: "wavis" }; // <-- replace with your verified sender in Brevo
    email.to = [{ email: to }];
    email.subject = subject;
    email.htmlContent = htmlContent;

    // Send email via Brevo
    const response = await brevo.sendTransacEmail(email);

    return res.status(200).json({ success: true, data: response });
  } catch (err: any) {
    console.error("Brevo send error:", err.response?.body || err.message);
    return res
      .status(500)
      .json({ success: false, error: err.response?.body || err.message });
  }
}
