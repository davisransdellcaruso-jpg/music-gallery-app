import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe"; // your configured Stripe instance
import { supabase } from "../../lib/supabase"; // your configured Supabase client

// Disable Next.js body parsing so we can verify Stripe signatures
export const config = {
  api: {
    bodyParser: false,
  },
};

// 🧩 Extended session type for safety
type ExtendedSession = Stripe.Checkout.Session & {
  shipping_details?: {
    name?: string | null;
    address?: Stripe.Address | null;
    phone?: string | null;
  } | null;
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

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Error verifying Stripe webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // ✅ Checkout session completed
      case "checkout.session.completed": {
        const session = event.data.object as ExtendedSession;

        console.log("✅ Checkout session completed:", session.id);

        const email = session.customer_details?.email || null;
        const amount_total = session.amount_total ? session.amount_total / 100 : 0;
        const shipping = session.shipping_details || null;

        // 🛒 Get purchased items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ["data.price.product"],
        });

        // ✅ Insert purchase record
        if (email) {
          const { error: purchaseError } = await supabase.from("purchases").insert([
            {
              email,
              stripe_session_id: session.id,
              amount_total,
              shipping,
              items: lineItems.data.map((item) => ({
                name: (item.price?.product as Stripe.Product)?.name || "Unknown Item",
                quantity: item.quantity,
                price_id: item.price?.id,
              })),
              created_at: new Date().toISOString(),
            },
          ]);

          if (purchaseError) {
            console.error("❌ Error inserting purchase:", purchaseError.message);
          } else {
            console.log(`💾 Purchase logged for ${email}`);
          }

          // ✅ Add to mailing list if not already there
          const { data: existing } = await supabase
            .from("mailing_list")
            .select("email")
            .eq("email", email)
            .single();

          if (!existing) {
            const { error: mailingError } = await supabase
              .from("mailing_list")
              .insert([{ email, source: "purchase", created_at: new Date().toISOString() }]);

            if (mailingError) {
              console.error("⚠️ Error adding to mailing list:", mailingError.message);
            } else {
              console.log(`📧 Added ${email} to mailing list.`);
            }
          } else {
            console.log(`📭 ${email} already in mailing list.`);
          }
        }

        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("💰 Payment succeeded:", pi.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn("⚠️ Payment failed:", pi.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("↩️ Charge refunded:", charge.id);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return res.status(200).send("Webhook received");
  } catch (err: any) {
    console.error("❌ Webhook handler failed:", err.message);
    return res.status(500).send("Server error");
  }
}
