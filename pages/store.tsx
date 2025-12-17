import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useCart } from "@/lib/cartContext";

const products = [

  {
    id: "cd",
    name: "The Fool CD",
    basePrice: 1500,
    image: "/thefoolcd.jpeg",
    variants: [{ size: "Standard", priceId: "price_1SKlA2LM8xwOOb8odxsDt8nz" }],
  },
];

export default function Store() {
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();

  const donate = async (amount: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-donation-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting donation session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-page trocchi">
      <link
        href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
        rel="stylesheet"
      />

      {/* Background layers */}
      <div className="glow-behind"></div>
      <div className="clouds"></div>
      <div className="mist"></div>

      {/* Nav bar */}
      <div className="nav-bar">
        <button onClick={() => router.push("/gallery")} className="dreamy-button">
          ← Back to Gallery
        </button>
        <button onClick={() => router.push("/cart")} className="dreamy-button">
          🛒 Cart
        </button>
      </div>

      {/* Header */}
      <div className="title-block">
        <h1 className="brand-title">Davis Caruso</h1>
        <div className="underline"></div>
      </div>

      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Merch Store</h2>
      <p style={{ textAlign: "center", marginBottom: "2rem", fontStyle: "italic" }}>
        All orders ship on the <b>1st of the month (included in the price)</b>. Thank you
        for your patience 💜
      </p>

      {/* Products grid */}
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image-wrapper">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="product-image"
              />
            </div>
            <h3>{product.name}</h3>
            <p>${(product.basePrice / 100).toFixed(2)}</p>

            {/* Variants */}
            <div className="variant-grid">
              {product.variants.map((variant, idx) => {
                const isSelected = selectedVariant[product.id] === variant.priceId;
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setSelectedVariant({
                        ...selectedVariant,
                        [product.id]: isSelected ? "" : variant.priceId,
                      })
                    }
                    className={`variant-btn ${isSelected ? "selected" : ""}`}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                const variantId = selectedVariant[product.id];
                if (!variantId) return;
                const variant = product.variants.find((v) => v.priceId === variantId);
                if (!variant) return;
                addToCart({
                  productId: product.id,
                  variantId: variant.priceId,
                  name: `${product.name} (${variant.size})`,
                  priceId: variant.priceId,
                  price: product.basePrice,
                  quantity: 1,
                });
                alert(`${product.name} (${variant.size}) added to cart!`);
              }}
              className="dreamy-button add-to-cart"
              disabled={!selectedVariant[product.id]}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Donation Section */}
      <div className="donation-section">
        <h2>Support My Music</h2>
        <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
          Your donations help keep the music alive 💜
        </p>
        <div className="donation-buttons">
          {[500, 2000, 10000, 25000].map((amt, i) => (
            <button
              key={i}
              className="dreamy-button pulse"
              onClick={() => donate(amt)}
              disabled={loading}
            >
              Donate ${amt / 100}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .trocchi {
          font-family: "Trocchi", serif;
        }

        .store-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          padding: 2rem 1rem;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Nav bar responsive */
        .nav-bar {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          width: 100%;
          z-index: 2;
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.25rem;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.9);
          transform: translateY(-2px);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          justify-content: center;
          align-items: start;
          width: 100%;
          max-width: 1000px;
        }

        .product-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .product-image-wrapper {
          position: relative;
          width: 100%;
          max-width: 360px;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .product-image {
          object-fit: cover;
        }

        .variant-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 0.5rem;
          margin-bottom: 1rem;
          width: 100%;
        }

        .variant-btn {
          height: 50px;
          border-radius: 8px;
          font-size: 0.9rem;
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .variant-btn.selected {
          background-color: rgba(174, 184, 254, 0.9);
          border: 2px solid #aeb8fe;
          box-shadow: 0 0 10px rgba(174, 184, 254, 0.9);
          color: #2a004f;
        }

        .add-to-cart {
          width: 100%;
          margin-top: auto;
        }

        .donation-section {
          margin-top: 3rem;
          text-align: center;
          width: 100%;
        }

        .donation-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          margin-top: 1rem;
        }

        @keyframes pulseGlow {
          from {
            box-shadow: 0 0 15px rgba(175, 184, 254, 0.6);
          }
          to {
            box-shadow: 0 0 25px rgba(175, 184, 254, 1);
          }
        }

        .pulse:hover {
          animation: pulseGlow 1.5s infinite alternate;
        }

        /* 📱 Mobile adjustments */
        @media (max-width: 600px) {
          .store-page {
            padding: 1rem 0.5rem;
          }

          .products-grid {
            gap: 1.5rem;
          }

          .product-card {
            padding: 0.75rem;
          }

          h3 {
            font-size: 1.1rem;
          }

          .dreamy-button {
            font-size: 0.9rem;
          }

          .donation-buttons {
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
