import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useCart } from "@/lib/cartContext";

const products = [
  {
    id: "poster",
    name: "Periwinkle Dragonfly Poster",
    basePrice: 1500,
    image: "/poster.jpeg",
    variants: [{ size: "Standard", priceId: "price_1SFiQpLM8xwOOb8o79aUovuy" }],
  },
  {
    id: "cd",
    name: "The Fool CD",
    basePrice: 1200,
    image: "/thefoolcd.jpeg",
    variants: [{ size: "Standard", priceId: "price_1SKlA2LM8xwOOb8odxsDt8nz" }],
  },
  {
    id: "tshirt",
    name: "Dreamin On Paris T-Shirt",
    basePrice: 3000,
    image: "/tshirt.jpeg",
    variants: [
      { size: "Small", priceId: "price_1SFv2OLM8xwOOb8opA4S2REn" },
      { size: "Medium", priceId: "price_1SFvE7LM8xwOOb8omcIVkVG5" },
      { size: "Large", priceId: "price_1SFvESLM8xwOOb8orM8YfxiD" },
      { size: "XL", priceId: "price_1SFvG6LM8xwOOb8oDjck2SSn" },
    ],
  },
  {
    id: "hoodie",
    name: "Dreamin On Paris Hoodie",
    basePrice: 5000,
    image: "/hoodie.jpeg",
    variants: [
      { size: "Small", priceId: "price_1SFv21LM8xwOOb8oHhXcEYR3" },
      { size: "Medium", priceId: "price_1SFvJALM8xwOOb8onDRbuOmw" },
    ],
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
      {/* Load Trocchi font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
        rel="stylesheet"
      />

      {/* Background layers */}
      <div className="glow-behind"></div>
      <div className="clouds"></div>
      <div className="mist"></div>

      {/* Top navigation bar */}
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
        <p className="tagline"></p>
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

            {/* Size buttons with toggle + glow */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${product.variants.length}, 1fr)`,
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
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
                    style={{
                      height: "80px",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      backgroundColor: isSelected
                        ? "rgba(174,184,254,0.9)"
                        : "rgba(255,255,255,0.1)",
                      color: "white",
                      border: isSelected
                        ? "2px solid #aeb8fe"
                        : "1px solid rgba(255,255,255,0.2)",
                      boxShadow: isSelected
                        ? "0 0 12px rgba(174,184,254,0.9)"
                        : "none",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>

            {/* Add to Cart button */}
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
              style={{
                width: "100%",
                opacity: selectedVariant[product.id] ? 1 : 0.6,
                cursor: selectedVariant[product.id] ? "pointer" : "not-allowed",
              }}
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
          <button className="dreamy-button pulse" onClick={() => donate(500)} disabled={loading}>
            Donate $5
          </button>
          <button className="dreamy-button pulse" onClick={() => donate(2000)} disabled={loading}>
            Donate $20
          </button>
          <button className="dreamy-button pulse" onClick={() => donate(10000)} disabled={loading}>
            Donate $100
          </button>
          <button className="dreamy-button pulse" onClick={() => donate(25000)} disabled={loading}>
            Donate $250
          </button>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .trocchi {
          font-family: "Trocchi", serif;
        }

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

        .products-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(300px, 1fr));
  grid-template-rows: repeat(2, auto);
  gap: 3rem;
  justify-content: center;
  align-items: start;
  position: relative;
  z-index: 2;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}
        }

        .product-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
          max-width: 400px;
          margin: 0 auto;
          font-family: "Trocchi", serif;
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-size: 1rem;
          font-family: "Trocchi", serif;
          font-weight: bold;
          transition: background-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
        }

        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.9);
          transform: translateY(-2px);
        }

        .add-to-cart {
          padding: 1rem 1.5rem;
          margin-top: 1rem;
        }

        .donation-section {
          margin-top: 4rem;
          text-align: center;
          z-index: 2;
          font-family: "Trocchi", serif;
        }

        .donation-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .pulse:hover {
          animation: pulseGlow 1.5s infinite alternate;
        }

        @keyframes pulseGlow {
          from {
            box-shadow: 0 0 15px rgba(175, 184, 254, 0.6);
          }
          to {
            box-shadow: 0 0 25px rgba(175, 184, 254, 1);
          }
        }
      `}</style>
    </div>
  );
}
