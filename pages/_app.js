// pages/_app.js
import "../styles/globals.css";
import { CartProvider } from "@/lib/cartContext";
import { Analytics } from "@vercel/analytics/react";
import ListenerPing from "@/components/ListenerPing";

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <ListenerPing />
      <Component {...pageProps} />
      <Analytics />
    </CartProvider>
  );
}