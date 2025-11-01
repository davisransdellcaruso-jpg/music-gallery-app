import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ Disable Next.js body parsing so we can verify Stripe signatures
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Create Supabase client using service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ Checkout session completed:", session.id);

        const email = session.customer_details?.email || null;
        const amount_total = session.amount_total ? session.amount_total / 100 : 0;
        const shipping = session.shipping_details || null;

        // 🛒 Get purchased items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ["data.price.product"],
        });

        const items = lineItems.data.map((item) => {
          const product = item.price?.product as Stripe.Product;
          const price_id = item.price?.id || "";

          // 🏷️ Automatically detect donation vs merch by product name
          const category = product?.name?.toLowerCase().includes("donation")
            ? "donation"
            : "merch";

          return {
            product: product?.name || "Unknown",
            price_id,
            quantity: item.quantity,
            category,
          };
        });

        // Determine overall purchase type
        const allDonations = items.every((i) => i.category === "donation");
        const purchase_type = allDonations ? "donation" : "merch";

        // 🧾 Save to Supabase purchases table
        const { error: purchaseError } = await supabase.from("purchases").insert([
          {
            email,
            amount: amount_total,
            stripe_session_id: session.id,
            items,
            purchase_type,
            shipping_name: shipping?.name || null,
            address_line1: shipping?.address?.line1 || null,
            city: shipping?.address?.city || null,
            state: shipping?.address?.state || null,
            postal_code: shipping?.address?.postal_code || null,
            country: shipping?.address?.country || null,
            created_at: new Date().toISOString(),
          },
        ]);

        if (purchaseError && !purchaseError.message.includes("duplicate key value")) {
          console.error("❌ Supabase insert error:", purchaseError.message);
        } else {
          console.log("✅ Purchase saved to Supabase:", email, amount_total);
        }

        // 📧 Add to mailing list (skip duplicates)
        if (email) {
          const { error: mailingError } = await supabase.from("mailing_list").upsert(
            { email },
            { onConflict: "email" }
          );

          if (mailingError) {
            console.error("❌ Mailing list insert error:", mailingError.message);
          } else {
            console.log("✅ Added to mailing list:", email);
          }
        }

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
