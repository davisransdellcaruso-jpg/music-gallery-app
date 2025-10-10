// pages/api/create-donation-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { amount } = req.body; // ✅ already parsed

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Donation" },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/donation-success`,
      cancel_url: `${req.headers.origin}/store`, // better than /cancel
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err.message);
    res.status(400).json({ error: { message: err.message } });
  }
}
