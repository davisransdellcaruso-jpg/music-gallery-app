// pages/_app.js
import "../styles/globals.css";
import { CartProvider } from "@/lib/cartContext"; // 👈 import your context

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
