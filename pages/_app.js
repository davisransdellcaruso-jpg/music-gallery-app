// pages/_app.js
import "../styles/globals.css";
import { CartProvider } from "@/lib/cartContext";
import { Analytics } from "@vercel/analytics/react"; // ✅ add this line

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
      <Analytics /> {/* ✅ Tracks all page views and interactions */}
    </CartProvider>
  );
}
