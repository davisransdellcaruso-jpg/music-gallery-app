import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get all products with their prices
    const products = await stripe.products.list({
      expand: ["data.default_price"],
    });

    // Map into something easier for the frontend
    const formatted = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({ product: product.id });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.images[0],
          variants: prices.data.map((price) => ({
            id: price.id,
            size: price.nickname, // nickname field stores "Small", "Medium", etc.
            stock: price.metadata.stock || "∞",
            unitAmount: price.unit_amount,
          })),
        };
      })
    );

    res.status(200).json(formatted);
  } catch (err: any) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: err.message });
  }
}
