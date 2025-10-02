// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sendBrevoEmail } from "@/lib/brevo";

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

    const result = await sendBrevoEmail({ to, subject, htmlContent });
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    console.error("Brevo error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Unknown error" });
  }
}
