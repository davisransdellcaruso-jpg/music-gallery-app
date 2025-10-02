// pages/store.tsx
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const products = [
  {
    id: "tshirt",
    name: "wavis T-Shirt",
    basePrice: 3000,
    image: "/tshirt.jpeg",
    variants: [
      { size: "Small", stock: 6, priceId: "price_1SBKTQLZry0DH74Axed97gUj" },
      { size: "Medium", stock: 12, priceId: "price_1SBKUfLZry0DH74A7TLRVZs4" },
      { size: "Large", stock: 6, priceId: "price_1SBKVALZry0DH74A2x5b4CbO" },
      { size: "XL", stock: 5, priceId: "price_1SBKVdLZry0DH74Auo5AJHoK" },
    ],
  },
  {
    id: "hoodie",
    name: "wavis Hoodie",
    basePrice: 5000,
    image: "/hoodie.jpeg",
    variants: [
      { size: "Small", stock: 2, priceId: "price_1SBKWcLZry0DH74AO1xQMA4Y" },
      { size: "Medium", stock: 2, priceId: "price_1SBKWqLZry0DH74AL43FLDqM" },
    ],
  },
];

export default function Store() {
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>(
    {}
  );
  const router = useRouter();

  return (
    <div className="store-page">
      {/* Background layers */}
      <div className="glow-behind"></div>
      <div className="clouds"></div>
      <div className="mist"></div>

      {/* Top navigation bar */}
      <div className="nav-bar">
        <button onClick={() => router.push("/welcome")} className="dreamy-button">
          ← Back to Welcome
        </button>
      </div>

      {/* Header */}
      <div className="title-block">
        <h1 className="brand-title">wavis</h1>
        <div className="underline"></div>
        <p className="tagline">art &amp; story</p>
      </div>

      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Merch Store</h2>
      <p style={{ textAlign: "center", marginBottom: "2rem", fontStyle: "italic" }}>
        🚧 Store under construction — check back soon! 🚧
      </p>

      {/* Products grid */}
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <Image
              src={product.image}
              alt={product.name}
              width={400}
              height={400}
              className="product-image"
            />
            <h3 style={{ marginBottom: "0.5rem" }}>{product.name}</h3>
            <p style={{ marginBottom: "1rem" }}>
              ${(product.basePrice / 100).toFixed(2)}
            </p>

            {/* Size buttons (disabled for now) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${product.variants.length}, 1fr)`,
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              {product.variants.map((variant, idx) => (
                <button
                  key={idx}
                  disabled
                  style={{
                    height: "80px",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "not-allowed",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "white",
                    border: "none",
                    opacity: 0.5,
                  }}
                >
                  {variant.size}
                  <br />
                  <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    {variant.stock} left
                  </span>
                </button>
              ))}
            </div>

            {/* Buy button (disabled) */}
            <button
              disabled
              className="dreamy-button"
              style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>

      {/* Styles */}
      <style jsx>{`
        .store-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          padding: 2rem;
          color: white;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .glow-behind {
          position: absolute;
          top: 20%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 180, 120, 0.6) 0%,
            rgba(255, 140, 100, 0.3) 40%,
            transparent 70%
          );
          filter: blur(40px);
          z-index: 0;
          animation: pulse 8s ease-in-out infinite alternate;
        }

        @keyframes pulse {
          from {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.7;
          }
          to {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 1;
          }
        }

        .nav-bar {
          width: 100%;
          max-width: 1200px;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .title-block {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .brand-title {
          font-size: 3rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: "Eurostile", "Futura", "Helvetica Neue", sans-serif;
        }

        .underline {
          width: 120px;
          height: 3px;
          margin: 0.5rem auto 1rem;
          background: linear-gradient(to right, #ff6b4a, #ffb347);
          border-radius: 2px;
        }

        .tagline {
          font-style: italic;
          font-size: 1.3rem;
          color: #ddd;
          font-family: "Didot", "Bodoni MT", serif;
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
          font-weight: bold;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          position: relative;
          z-index: 2;
          max-width: 1200px;
          width: 100%;
        }

        .product-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
          max-width: 400px;
          margin: 0 auto;
        }

        .product-image {
          border-radius: 8px;
          margin-bottom: 1rem;
          object-fit: cover;
        }

        .clouds {
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 100%;
          background: url("/clouds.png") repeat-x;
          background-size: cover;
          opacity: 0.2;
          animation: drift 60s linear infinite;
        }

        .mist {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0) 70%
          );
          pointer-events: none;
        }

        @keyframes drift {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
