// lib/stripe.ts
import Stripe from "stripe";

// Initialize Stripe with your secret key.
// No apiVersion hardcoded → avoids type mismatches on upgrades.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
