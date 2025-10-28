// pages/_app.js
import "../styles/globals.css";
import { CartProvider } from "@/lib/cartContext";
import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();

        // Show quick feedback
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1800);

        // Open listener map in new tab
        window.open("/listener-map", "_blank");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router]);

  return (
    <CartProvider>
      <Component {...pageProps} />
      <Analytics />

      {/* 🌌 Celestial gradient toast */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background:
              "linear-gradient(135deg, rgba(167,139,250,0.95), rgba(196,181,253,0.9))",
            color: "#fff",
            padding: "0.9rem 1.4rem",
            borderRadius: "12px",
            fontFamily: "Trocchi, serif",
            fontSize: "1.05rem",
            boxShadow: "0 0 25px rgba(167,139,250,0.8)",
            letterSpacing: "0.4px",
            textShadow: "0 0 8px rgba(255,255,255,0.6)",
            zIndex: 9999,
            opacity: 1,
            transition: "opacity 0.4s ease",
          }}
        >
          🌎 Opening Listener Map…
        </div>
      )}
    </CartProvider>
  );
}
