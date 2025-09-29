// pages/api/webhooks.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import { stripe } from "../../lib/stripe";

// Disable Next.js body parsing so we can verify Stripe signatures
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).send("Missing Stripe signature or webhook secret");
  }

  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Error verifying Stripe webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event types
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        console.log("✅ Checkout session completed:", session.id);

        // Example: You can update your DB, fulfill order, etc.
        // await supabase.from("orders").insert({ session_id: session.id, ... })
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        console.log("💰 Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        console.warn("⚠️ Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).send("Webhook received");
  } catch (err: any) {
    console.error("❌ Webhook handler failed:", err.message);
    return res.status(500).send("Server error");
  }
}
