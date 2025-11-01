// pages/api/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil", // ✅ explicit Stripe API version
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Items array is required" });
      }

      // 🧾 Format items for Stripe Checkout
      const line_items = items.map((item: { priceId: string; quantity: number }) => ({
        price: item.priceId,
        quantity: item.quantity,
      }));

      // 🚚 Create Checkout Session with address collection only
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,

        // ✅ Collect U.S. shipping addresses only
        shipping_address_collection: {
          allowed_countries: ["US"],
        },

        // ✅ Redirect URLs
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/store-cancel`,
      });

      console.log("Stripe session created:", session.id);
      res.status(200).json({ id: session.id });
    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
