"use client";
// Flat, detailed world map (MapLibre GL). Everything that touches the map lives in this
// file, which ListenerMap loads with next/dynamic (ssr: false).
//
// Needs:  npm i maplibre-gl
// Base map: OpenFreeMap (free, no API key). Terrain: free AWS elevation tiles.

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Strings } from "./i18n";

export type Cluster = {
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  listeners: number;
};

export type ButterflyCluster = {
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  butterflies: number; // joined, no fan pin: drawn as small butterflies
  joined?: number; // everyone who joined here (fan pins too)
};

const areaKey = (a: { city: string | null; region: string | null; country: string | null }) =>
  `${a.city ?? ""}|${a.region ?? ""}|${a.country ?? ""}`;

export type FanPin = {
  id: string;
  display_name: string;
  city: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  story?: string | null; // lyrics from early pins (no longer shown)
  mood?: string | null; // emoji for their mood
  edit_token?: string; // only ever kept on the fan's own device
};

export type Focus = {
  lat: number;
  lng: number;
  key: number; // changes every time, so repeat searches re-fly
  pinId?: string;
} | null;

type Props = {
  clusters: Cluster[];
  butterflies?: ButterflyCluster[];
  pins: FanPin[];
  mineId: string | null; // an approved pin that belongs to this visitor
  pendingPin: FanPin | null; // this visitor's pin, still awaiting approval
  focus: Focus;
  t: Strings;
};

// Flat, detailed, realistic base map: Esri "World Topo Map" raster tiles
// (shaded relief, blue seas with depth, green lowlands -> tan/brown highlands,
// borders, roads and place names). Free to use with attribution.
const BASE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
const BASE_STYLE: any = {
  version: 8,
  sources: {
    base: {
      type: "raster",
      tiles: [BASE_TILES],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        'Tiles &copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, HERE, Garmin, FAO, NOAA, USGS, OpenStreetMap contributors',
    },
  },
  layers: [
    { id: "base", type: "raster", source: "base", paint: { "raster-saturation": 0.12, "raster-contrast": 0.05 } },
  ],
};
const DEM_TILES =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

const css = `
  /* Cream paper frame with an indigo outline and offset shadow */
  .dc-frame {
    position: relative; overflow: hidden;
    background: #e3d8f5;
    border: 3px solid #53288f;
  }
  .dc-map { position: absolute; inset: 0; z-index: 1; }

  /* Listeners: tiny caterpillars that slowly inch along */
  .dc-listener { line-height: 1; cursor: default; user-select: none; }
  .dc-listener span {
    display: inline-block; transform-origin: 50% 100%;
    will-change: transform;
    animation: dc-inch 2.8s ease-in-out infinite;
  }
  @keyframes dc-inch {
    0%, 70%, 100% { transform: scale(1, 1); }
    80% { transform: scale(0.86, 1.12) translateY(-1px); }
    90% { transform: scale(1.06, 0.94); }
  }
  /* Butterflies: listeners who joined La Famiglia, gently fluttering */
  .dc-butterfly { line-height: 1; cursor: default; user-select: none; z-index: 1; opacity: 0.6; }
  .dc-butterfly span {
    display: inline-block; will-change: transform;
    animation: dc-flutter 3.6s ease-in-out infinite;
  }
  @keyframes dc-flutter {
    0%, 100% { transform: translateY(0) scaleX(1) rotate(-4deg); }
    20% { transform: translateY(-3px) scaleX(0.55) rotate(2deg); }
    30% { transform: translateY(-4px) scaleX(1) rotate(4deg); }
    50% { transform: translateY(-1px) scaleX(0.6) rotate(0deg); }
    60% { transform: translateY(-2px) scaleX(1) rotate(-3deg); }
  }
  /* While the map is being dragged/zoomed, hold every critter still */
  .dc-moving .dc-listener span, .dc-moving .dc-butterfly span, .dc-moving .fan-pin .fly {
    animation-play-state: paused;
  }
  @media (prefers-reduced-motion: reduce) {
    .dc-listener span, .dc-butterfly span, .fan-pin .fly { animation: none; }
  }

  /* Fan pins: full butterflies with a little mood badge (tap to say hi) */
  .fan-pin { position: relative; width: 30px; height: 30px; cursor: pointer; z-index: 2; }
  .fan-pin .fly {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 25px; line-height: 1; will-change: transform;
    animation: dc-flutter 3.6s ease-in-out infinite;
  }
  .fan-pin .mood {
    position: absolute; right: -7px; bottom: -5px; width: 18px; height: 18px;
    border-radius: 50%; box-sizing: border-box; background: #f2eafa; border: 1.5px solid #53288f;
    display: flex; align-items: center; justify-content: center; font-size: 10px; line-height: 1;
  }
  .fan-pin.mine .fly { filter: drop-shadow(0 0 6px rgba(242,194,122,0.95)) drop-shadow(0 0 2px #e8762c); }
  .fan-pin.mine .mood { background: #f2c27a; border-color: #c24a1c; }
  .fan-pin.pending { opacity: 0.5; }
  .fan-pin.pending .mood { border-style: dashed; }

  /* Popups + controls: cream paper cards with an indigo outline */
  .dc-map .maplibregl-popup-content {
    background: #f2eafa; color: #53288f; border-radius: 12px; padding: 14px 16px;
    border: 2px solid #53288f; box-shadow: 4px 4px 0 #53288f;
  }
  .dc-map .maplibregl-popup-anchor-top .maplibregl-popup-tip { border-bottom-color: #53288f; }
  .dc-map .maplibregl-popup-anchor-bottom .maplibregl-popup-tip { border-top-color: #53288f; }
  .dc-map .maplibregl-popup-anchor-left .maplibregl-popup-tip { border-right-color: #53288f; }
  .dc-map .maplibregl-popup-anchor-right .maplibregl-popup-tip { border-left-color: #53288f; }
  .dc-map .maplibregl-popup-close-button { color: #53288f; font-size: 18px; }
  .dc-map .maplibregl-ctrl-group { background: #f2eafa; border: 2px solid #53288f; border-radius: 10px; box-shadow: none; }
  .dc-map .maplibregl-ctrl-group button + button { border-top: 1px solid rgba(83,40,143,0.35); }
  .dc-map .maplibregl-ctrl-attrib { background: rgba(242,234,250,0.85); color: #53288f; }
  .dc-map .maplibregl-ctrl-attrib a { color: #53288f; }
`;


function buildPopup(pin: FanPin, note?: string): HTMLElement {
  // textContent only: fan stories are user-written, never inject as HTML
  const root = document.createElement("div");
  root.style.maxWidth = "240px";

  if (note) {
    const n = document.createElement("div");
    n.style.cssText = "color:#d9c2ff;font-size:12px;margin-bottom:4px";
    n.textContent = note;
    root.appendChild(n);
  }
  const name = document.createElement("b");
  name.textContent = `${pin.mood ? pin.mood + " " : ""}${pin.display_name}`;
  root.appendChild(name);

  const where = document.createElement("div");
  where.style.cssText = "opacity:.7;font-size:12px";
  where.textContent = [pin.city, pin.region, pin.country]
    .filter(Boolean)
    .join(", ");
  root.appendChild(where);

  return root;
}

export default function MapView({
  clusters,
  butterflies = [],
  pins,
  mineId,
  pendingPin,
  focus,
  t,
}: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const pinMarkerRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const spinRef = useRef(true);

  // Phones: edge-to-edge map, no frame, no zoom buttons (pinch works)
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    mapRef.current?.resize();
  }, [compact]);

  // ── Create the map once ───────────────────────────────────────────────
  useEffect(() => {
    if (!boxRef.current) return;
    spinRef.current = false;

    const map = new maplibregl.Map({
      container: boxRef.current,
      style: BASE_STYLE,
      center: [10, 30],
      zoom: 1.7,
      minZoom: 1.2,
      pitch: 0,
      maxPitch: 60,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    // Pause the critters' animations while the map moves (much smoother panning)
    const box = boxRef.current;
    map.on("movestart", () => box.classList.add("dc-moving"));
    map.on("moveend", () => box.classList.remove("dc-moving"));

    const phone = window.matchMedia("(max-width: 640px)").matches;
    if (!phone) {
      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true }),
        "top-left"
      );
    } else {
      // keep the credit available, but tucked into its small (i) button
      map.on("load", () => {
        try {
          const a = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
          a?.classList.remove("maplibregl-compact-show");
          a?.removeAttribute("open");
        } catch {
          /* cosmetic only */
        }
      });
    }

    // Subtle real relief: only visible once the visitor tilts the map
    map.on("load", () => {
      try {
        map.addSource("dem", {
          type: "raster-dem",
          tiles: [DEM_TILES],
          encoding: "terrarium",
          tileSize: 256,
          maxzoom: 14,
        });
      } catch {
        /* terrain is a nice-to-have */
      }
      // 3D relief is costly to render, so it's only switched on while the map is tilted
      let terrainOn = false;
      const syncTerrain = () => {
        const want = map.getPitch() > 5;
        if (want === terrainOn || !map.getSource("dem")) return;
        terrainOn = want;
        try {
          map.setTerrain(want ? { source: "dem", exaggeration: 1.3 } : null);
        } catch {
          /* ignore */
        }
      };
      map.on("pitchend", syncTerrain);
      syncTerrain();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      pinMarkerRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── (Re)draw dots + pins whenever the data changes ────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    pinMarkerRef.current.clear();

    // Caterpillars: anonymous listeners, grouped by area
    // Listeners who joined La Famiglia show as butterflies instead of caterpillars
    const joined = new Map<string, number>();
    for (const b of butterflies)
      joined.set(areaKey(b), (joined.get(areaKey(b)) ?? 0) + (b.joined ?? b.butterflies));

    for (const b of butterflies) {
      if (b.butterflies <= 0) continue; // only fans with their own pin here
      const r = Math.min(14, 4 + Math.sqrt(b.butterflies) * 1.6);
      const el = document.createElement("div");
      el.className = "dc-butterfly";
      el.style.fontSize = `${Math.round(8 + r * 0.6)}px`;
      const fly = document.createElement("span");
      fly.textContent = "🦋";
      fly.style.animationDelay = `${(Math.random() * 3.6).toFixed(2)}s`;
      el.appendChild(fly);
      const place = [b.city, b.region].filter(Boolean).join(", ") || t.somewhere;
      el.title = `${place} · ${t.butterflyCount(b.butterflies)}`;
      markersRef.current.push(
        new maplibregl.Marker({ element: el }).setLngLat([b.longitude, b.latitude]).addTo(map)
      );
    }

    for (const raw of clusters) {
      const left = raw.listeners - (joined.get(areaKey(raw)) ?? 0);
      if (left <= 0) continue; // everyone here has become a butterfly
      const c = { ...raw, listeners: left };
      const r = Math.min(14, 4 + Math.sqrt(c.listeners) * 1.6);
      const el = document.createElement("div");
      el.className = "dc-listener";
      // Bigger caterpillar for more listeners (about 12px → 24px)
      el.style.fontSize = `${Math.round(8 + r)}px`;
      const bug = document.createElement("span");
      bug.textContent = "🐛";
      // Each one inches on its own rhythm
      bug.style.animationDelay = `${(Math.random() * 2.8).toFixed(2)}s`;
      el.appendChild(bug);
      const place = [c.city, c.region].filter(Boolean).join(", ") || t.somewhere;
      el.title = `${place} · ${t.listenCount(c.listeners)}`;
      markersRef.current.push(
        new maplibregl.Marker({ element: el })
          .setLngLat([c.longitude, c.latitude])
          .addTo(map)
      );
    }

    // Fan pins (approved) + this visitor's pending pin
    const addPin = (pin: FanPin, kind: "" | "mine" | "pending", note?: string) => {
      const el = document.createElement("div");
      el.className = "fan-pin" + (kind ? ` ${kind}` : "");
      const fly = document.createElement("span");
      fly.className = "fly";
      fly.textContent = "🦋";
      fly.style.animationDelay = `${(Math.random() * 3.6).toFixed(2)}s`;
      el.appendChild(fly);
      if (pin.mood) {
        const badge = document.createElement("span");
        badge.className = "mood";
        badge.textContent = pin.mood; // their mood, on the butterfly's wing
        el.appendChild(badge);
      }
      el.title = `${note ? note + " " : ""}${pin.mood ? pin.mood + " " : ""}${pin.display_name} · ${pin.city}`;

      const popup = new maplibregl.Popup({ offset: 14, maxWidth: "280px" }).setDOMContent(
        buildPopup(pin, note)
      );
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(map);
      el.addEventListener("click", () => {
        spinRef.current = false;
      });
      markersRef.current.push(marker);
      pinMarkerRef.current.set(pin.id, marker);
    };

    for (const pin of pins) {
      const isMine = pin.id === mineId;
      addPin(pin, isMine ? "mine" : "", isMine ? t.thatsYou : undefined);
    }
    if (pendingPin) addPin(pendingPin, "pending", t.pendingNote);
  }, [clusters, butterflies, pins, mineId, pendingPin, t]);

  // ── Search / "find my pin": fly there, tilt, open the story ───────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    spinRef.current = false;

    map.flyTo({
      center: [focus.lng, focus.lat],
      zoom: Math.max(map.getZoom(), 5.5),
      pitch: 50,
      duration: 2200,
      essential: true,
    });

    if (!focus.pinId) return;
    const id = focus.pinId;
    const timer = setTimeout(() => {
      const m = pinMarkerRef.current.get(id);
      const popup = m?.getPopup();
      if (m && popup && !popup.isOpen()) m.togglePopup();
    }, 2400);
    return () => clearTimeout(timer);
  }, [focus]);

  return (
    <>
      <style>{css}</style>
      <div
        className="dc-frame"
        style={
          compact
            ? { height: "100dvh", width: "100vw", border: "none", borderRadius: 0, zIndex: 1 }
            : {
                height: "90vh",
                width: "90vw",
                borderRadius: "10px",
                boxShadow: "6px 6px 0 #53288f",
                zIndex: 1,
              }
        }
      >
        <div ref={boxRef} className="dc-map" />
      </div>
    </>
  );
}