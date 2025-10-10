// pages/success.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useCart } from "@/lib/cartContext";

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    if (session_id) {
      fetch(`/api/get-checkout-session?session_id=${session_id}`)
        .then((res) => res.json())
        .then((data) => {
          setSession(data);
          setLoading(false);
        });
    }
    clearCart();
  }, [session_id, clearCart]);

  if (loading)
    return <p style={{ color: "white", textAlign: "center" }}>Loading your order...</p>;

  if (!session)
    return <p style={{ color: "red", textAlign: "center" }}>No session found.</p>;

  return (
    <div className="success-page">
      <h1>🎉 Thank you for your order!</h1>
      <p>
        We’ve received your payment of{" "}
        <b>${(session.amount_total / 100).toFixed(2)}</b>.
      </p>

      <h2>Items:</h2>
      <ul>
        {session.line_items?.data.map((item: any, idx: number) => (
          <li key={idx}>
            {item.quantity} × {item.price.product.name}
          </li>
        ))}
      </ul>

      <div className="button-group">
        <button onClick={() => router.push("/store")} className="dreamy-button">
          Back to Store
        </button>
        <button onClick={() => router.push("/gallery")} className="dreamy-button secondary">
          Back to Gallery
        </button>
      </div>

      <style jsx>{`
        .success-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          color: white;
          text-align: center;
        }
        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
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
        .dreamy-button.secondary {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }
        .dreamy-button.secondary:hover {
          background-color: rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
}
