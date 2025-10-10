// pages/store-cancel.tsx
import { useRouter } from "next/router";

export default function StoreCancel() {
  const router = useRouter();

  return (
    <div className="cancel-page">
      <h1>❌ Checkout Cancelled</h1>
      <p>Your order wasn’t completed. No charges have been made.</p>
      <p>If you’d like, you can head back and continue browsing the store.</p>

      <div className="button-group">
        <button onClick={() => router.push("/store")} className="dreamy-button">
          Back to Store
        </button>
        <button onClick={() => router.push("/gallery")} className="dreamy-button secondary">
          Back to Gallery
        </button>
      </div>

      <style jsx>{`
        .cancel-page {
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

        h1 {
          font-size: 2.2rem;
          margin-bottom: 1rem;
        }

        p {
          font-size: 1.2rem;
          margin: 0.5rem 0;
          color: #ddd;
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
