// Place at: components/ListenerPing.tsx
//
// Add it once in pages/_app.tsx so every page counts:
//
//   import ListenerPing from "@/components/ListenerPing";
//   ...
//   return (
//     <>
//       <ListenerPing />
//       <Component {...pageProps} />
//     </>
//   );

"use client";
import { useEffect } from "react";

const ID_KEY = "dc_visitor_id";
const SENT_KEY = "dc_visit_sent";

export default function ListenerPing() {
  useEffect(() => {
    try {
      // A random ID for this browser, so one person = one dot
      let id = localStorage.getItem(ID_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(ID_KEY, id);
      }

      // Only ping once per day per browser
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(SENT_KEY) === today) return;

      fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: id }),
        keepalive: true,
      })
        .then((r) => {
          if (r.ok) localStorage.setItem(SENT_KEY, today);
        })
        .catch(() => {});
    } catch {
      /* storage blocked (private mode, etc.): skip quietly */
    }
  }, []);

  return null;
}