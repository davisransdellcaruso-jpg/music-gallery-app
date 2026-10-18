"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";

const MapContainer = dynamic<any>(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic<any>(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic<any>(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Tooltip = dynamic<any>(
  () => import("react-leaflet").then((m) => m.Tooltip),
  { ssr: false }
);

type Listen = {
  id: string;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

// Only the newest N listeners get the animated pulse ring (keeps things smooth)
const PULSE_COUNT = 25;

const mapCss = `
  /* Dark-ify the OSM tiles only (markers keep their real colors) */
  .dark-tiles {
    filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.95) saturate(0.6);
  }

  .listener-pin {
    position: relative;
    width: 20px;
    height: 20px;
  }
  .listener-pin .dot {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 12px;
    height: 12px;
    margin: -6px 0 0 -6px;
    border-radius: 50%;
    background: #a78bfa;
    border: 2px solid #c4b5fd;
    box-sizing: border-box;
    opacity: 0.95;
  }
  .listener-pin .ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(167, 139, 250, 0.55) 0%,
      rgba(167, 139, 250, 0) 70%
    );
    pointer-events: none;
    animation: listener-pulse 3.5s ease-out infinite;
  }
  @keyframes listener-pulse {
    0%   { transform: scale(0.6); opacity: 0.9; }
    100% { transform: scale(2.8); opacity: 0; }
  }
`;

export default function ListenerMap() {
  const [listens, setListens] = useState<Listen[]>([]);
  const [loading, setLoading] = useState(true);
  const [L, setL] = useState<any>(null);

  // 🔹 Load Leaflet on the client only (it touches `window`)
  useEffect(() => {
    import("leaflet").then((m) => setL((m as any).default ?? m));
  }, []);

  // 🔹 Initial fetch
  useEffect(() => {
    async function fetchListens() {
      const { data, error } = await supabase
        .from("listens")
        .select("id, city, region, country, latitude, longitude")
        .not("latitude", "is", null)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) setListens(data);
      setLoading(false);
    }
    fetchListens();
  }, []);

  // 🔹 Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("realtime:listens")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "listens" },
        (payload) => {
          const newListen = payload.new as Listen;
          if (newListen.latitude && newListen.longitude) {
            setListens((prev) => [newListen, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading || !L)
    return (
      <div style={{ color: "white", textAlign: "center" }}>
        Loading listener map…
      </div>
    );

  const makeIcon = (pulse: boolean) =>
    L.divIcon({
      className: "", // drop Leaflet's default white box styling
      html: `<div class="listener-pin">${
        pulse ? '<span class="ring"></span>' : ""
      }<span class="dot"></span></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        background:
          "radial-gradient(circle at 30% 50%, #3b1977 0%, #1a0b33 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{mapCss}</style>

      {/* ✨ Animated starfield backdrop */}
      <motion.div
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(1px 1px at 20px 20px, rgba(255,255,255,0.2) 50%, transparent 50%)",
          backgroundSize: "100px 100px",
          opacity: 0.4,
          zIndex: 0,
        }}
      />

      <h1
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#E0D4FF",
          fontFamily: "Trocchi, serif",
          fontWeight: "bold",
          fontSize: "2.4rem",
          letterSpacing: "0.5px",
          zIndex: 1000,
          textShadow: "0 0 12px rgba(167,139,250,0.9)",
        }}
      >
        🌎 Listener Map
      </h1>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{
          height: "90vh",
          width: "90vw",
          borderRadius: "18px",
          boxShadow: "0 0 40px rgba(167,139,250,0.35)",
          zIndex: 1,
          background: "#1a1a1a",
        }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-tiles"
        />

        {listens.map(
          (l, i) =>
            l.latitude &&
            l.longitude && (
              <Marker
                key={l.id}
                position={[l.latitude, l.longitude]}
                icon={makeIcon(i < PULSE_COUNT)}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div style={{ textAlign: "center" }}>
                    <b>{l.city || "Unknown"}</b>
                    <br />
                    {l.region ? `${l.region}, ` : ""}
                    {l.country || ""}
                  </div>
                </Tooltip>
              </Marker>
            )
        )}
      </MapContainer>
    </div>
  );
}