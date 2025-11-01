"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";

// ✅ Dynamic imports with 'any' type to avoid TS prop mismatches
const MapContainer = dynamic<any>(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic<any>(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic<any>(
  () => import("react-leaflet").then((m) => m.CircleMarker),
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

export default function ListenerMap() {
  const [listens, setListens] = useState<Listen[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return (
      <div style={{ color: "white", textAlign: "center" }}>
        Loading listener map…
      </div>
    );

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
        }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='© <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {listens.map(
          (l) =>
            l.latitude &&
            l.longitude && (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <CircleMarker
                  center={[l.latitude, l.longitude]}
                  radius={6}
                  pathOptions={{
                    color: "#c4b5fd",
                    fillColor: "#a78bfa",
                    fillOpacity: 0.9,
                  }}
                >
                  <Tooltip direction="top">
                    <div style={{ textAlign: "center" }}>
                      <b>{l.city || "Unknown"}</b>
                      <br />
                      {l.region ? `${l.region}, ` : ""}
                      {l.country || ""}
                    </div>
                  </Tooltip>
                </CircleMarker>

                <motion.div
                  style={{
                    position: "absolute",
                    zIndex: 500,
                    borderRadius: "50%",
                    pointerEvents: "none",
                  }}
                  animate={{
                    scale: [1, 2.5],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      background:
                        "radial-gradient(circle, rgba(167,139,250,0.5) 0%, rgba(167,139,250,0) 80%)",
                    }}
                  />
                </motion.div>
              </motion.div>
            )
        )}
      </MapContainer>
    </div>
  );
}
