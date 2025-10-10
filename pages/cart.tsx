// pages/cart.tsx
import { useCart } from "@/lib/cartContext";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/router";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const stripe = await stripePromise;
    if (!stripe) {
      console.error("Stripe failed to initialize.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            priceId: item.priceId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Checkout session error:", err);
        setLoading(false);
        return;
      }

      const { id } = await res.json();
      const { error } = await stripe.redirectToCheckout({ sessionId: id });

      if (error) {
        console.error("Stripe redirect error:", error);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart-page">
      <h1 className="brand-title">Your Cart</h1>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul className="cart-list">
            {cart.map((item, idx) => (
              <li key={idx} className="cart-item">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
                <button
                  onClick={() => removeFromCart(item.variantId)}
                  className="dreamy-button small"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <h2>Total: ${(total / 100).toFixed(2)}</h2>

          <div className="cart-actions">
            <button
              onClick={handleCheckout}
              className="dreamy-button"
              disabled={loading}
            >
              {loading ? "Processing..." : "Checkout"}
            </button>
            <button onClick={clearCart} className="dreamy-button secondary">
              Clear Cart
            </button>
            <button
              onClick={() => router.push("/store")}
              className="dreamy-button secondary"
            >
              ← Back to Store
            </button>
            <button
              onClick={() => router.push("/gallery")}
              className="dreamy-button secondary"
            >
              ← Back to Gallery
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .cart-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          padding: 2rem;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .brand-title {
          font-size: 2rem;
          margin-bottom: 2rem;
        }
        .cart-list {
          list-style: none;
          padding: 0;
          margin-bottom: 2rem;
          width: 100%;
          max-width: 600px;
        }
        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }
        .cart-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1rem;
        }
        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.8);
        }
        .dreamy-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .dreamy-button.secondary {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }
        .dreamy-button.small {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
