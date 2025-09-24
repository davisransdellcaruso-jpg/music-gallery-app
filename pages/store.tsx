// pages/store.tsx
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/router";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Hardcoded products (replace priceId with real Stripe IDs)
const products = [
  {
    id: "tshirt",
    name: "Band T-Shirt",
    price: 2500, // $25
    priceId: "price_12345",
    image: "/tshirt.jpg",
  },
  {
    id: "poster",
    name: "Poster",
    price: 1500, // $15
    priceId: "price_67890",
    image: "/poster.jpg",
  },
];

export default function Store() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID if logged in
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const handleCheckout = async (priceId: string) => {
    if (!userId) {
      alert("You must be logged in to purchase.");
      return;
    }

    setLoading(priceId);
    const stripe = await stripePromise;

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, userId }),
    });

    const session = await res.json();
    await stripe?.redirectToCheckout({ sessionId: session.id });
    setLoading(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#4b2a6f",
        padding: "2rem",
        color: "white",
        fontFamily: "Bodoni, serif",
      }}
    >
      {/* Top navigation bar */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={() => router.push("/welcome")}
          style={{
            backgroundColor: "#6B4F82",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          ← Back to Welcome
        </button>

        <button
          onClick={() => router.push("/gallery")}
          style={{
            backgroundColor: "#6B4F82",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          🎵 Gallery
        </button>
      </div>

      {/* Header */}
      <h1
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          fontSize: "2rem",
        }}
      >
        dav.wav gallery — Merch Store
      </h1>

      {/* Product grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "2rem",
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "1rem",
              textAlign: "center",
              boxShadow: "0 10px 20px rgba(0,0,0,0.4)",
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "1rem",
              }}
            />
            <h2 style={{ marginBottom: "0.5rem" }}>{product.name}</h2>
            <p style={{ marginBottom: "1rem" }}>
              ${(product.price / 100).toFixed(2)}
            </p>
            <button
              onClick={() => handleCheckout(product.priceId)}
              disabled={loading === product.priceId}
              style={{
                backgroundColor: "#6B4F82",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "0.75rem 1.5rem",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              {loading === product.priceId ? "Processing..." : "Buy Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
