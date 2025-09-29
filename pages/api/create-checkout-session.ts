// pages/api/create-checkout-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../lib/stripe"; // ✅ use centralized stripe instance

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "Missing priceId" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/store-cancel`,
    });

    return res.status(200).json({ id: session.id });
  } catch (err: any) {
    console.error("Stripe Checkout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
