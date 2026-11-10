// pages/_app.js
import "../styles/globals.css";
import { CartProvider } from "@/lib/cartContext";
import { Analytics } from "@vercel/analytics/react";
import ListenerPing from "@/components/ListenerPing";
import { useRedditPageEvents } from "@/lib/useRedditPageEvents";
import { useEffect } from "react";
import { captureSource } from "@/lib/signupTracking";

export default function App({ Component, pageProps }) {
  useRedditPageEvents();

  // Remember ?src= from bio links and QR codes for the signup stats
  useEffect(() => {
    captureSource();
  }, []);

  return (
    <CartProvider>
      <ListenerPing />
      <Component {...pageProps} />
      <Analytics />
    </CartProvider>
  );
}