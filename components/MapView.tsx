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

export type FanPin = {
  id: string;
  display_name: string;
  city: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  story: string; // the lyrics they shared
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
    background: #cfe3f2;
    border: 3px solid #3b0a8c;
  }
  .dc-map { position: absolute; inset: 0; z-index: 1; }

  /* Listener dots: flat red discs */
  .dc-listener {
    border-radius: 50%; background: rgba(232,38,27,0.78);
    border: 2px solid #f3eee6;
  }

  /* Fan pins: cream dot, indigo outline, pink pulse */
    .fan-pin { width: 26px; height: 26px; cursor: pointer; }
  .fan-pin .dot {
    position: absolute; top: 50%; left: 50%;
    width: 24px; height: 24px; margin: -12px 0 0 -12px;
    border-radius: 50%; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; line-height: 1;
    background: #f3eee6; border: 3px solid #3b0a8c;
  }
  .fan-pin .ring {
    position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
    border: 3px solid #ff3d7f;
    animation: fan-pulse 3.2s ease-out infinite;
  }
  .fan-pin.mine .dot { background: #ffb59a; border-color: #e8261b; }
  .fan-pin.mine .ring { border-color: #e8261b; }
  .fan-pin.pending .dot { background: transparent; border: 3px dashed #3b0a8c; }
  .fan-pin.pending .ring { animation: none; opacity: 0; }
  @keyframes fan-pulse {
    0%   { transform: scale(0.5); opacity: 0.95; }
    100% { transform: scale(2.8); opacity: 0; }
  }

  /* Popups + controls: cream paper cards with an indigo outline */
  .dc-map .maplibregl-popup-content {
    background: #f3eee6; color: #3b0a8c; border-radius: 12px; padding: 14px 16px;
    border: 2px solid #3b0a8c; box-shadow: 4px 4px 0 #3b0a8c;
  }
  .dc-map .maplibregl-popup-anchor-top .maplibregl-popup-tip { border-bottom-color: #3b0a8c; }
  .dc-map .maplibregl-popup-anchor-bottom .maplibregl-popup-tip { border-top-color: #3b0a8c; }
  .dc-map .maplibregl-popup-anchor-left .maplibregl-popup-tip { border-right-color: #3b0a8c; }
  .dc-map .maplibregl-popup-anchor-right .maplibregl-popup-tip { border-left-color: #3b0a8c; }
  .dc-map .maplibregl-popup-close-button { color: #3b0a8c; font-size: 18px; }
  .dc-map .maplibregl-ctrl-group { background: #f3eee6; border: 2px solid #3b0a8c; border-radius: 10px; box-shadow: none; }
  .dc-map .maplibregl-ctrl-group button + button { border-top: 1px solid rgba(59,10,140,0.35); }
  .dc-map .maplibregl-ctrl-attrib { background: rgba(243,238,230,0.85); color: #3b0a8c; }
  .dc-map .maplibregl-ctrl-attrib a { color: #3b0a8c; }
`;


function buildPopup(pin: FanPin, note?: string): HTMLElement {
  // textContent only: fan stories are user-written, never inject as HTML
  const root = document.createElement("div");
  root.style.maxWidth = "240px";

  if (note) {
    const n = document.createElement("div");
    n.style.cssText = "color:#f0abfc;font-size:12px;margin-bottom:4px";
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

  const story = document.createElement("div");
  story.style.cssText = "margin-top:8px;line-height:1.45;font-style:italic";
  story.textContent = `\u201C${pin.story}\u201D`;
  root.appendChild(story);
  return root;
}

export default function MapView({
  clusters,
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
        map.setTerrain({ source: "dem", exaggeration: 1.3 });
      } catch {
        /* terrain is a nice-to-have */
      }
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

    // Faint dots: anonymous listeners, grouped by area
    for (const c of clusters) {
      const r = Math.min(14, 4 + Math.sqrt(c.listeners) * 1.6);
      const el = document.createElement("div");
      el.className = "dc-listener";
      el.style.width = el.style.height = `${r * 2}px`;
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
      el.innerHTML = '<span class="ring"></span><span class="dot"></span>';
      if (pin.mood) {
        const dot = el.querySelector(".dot");
        if (dot) dot.textContent = pin.mood; // emoji inside the pin
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
  }, [clusters, pins, mineId, pendingPin, t]);

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
                boxShadow: "6px 6px 0 #3b0a8c",
                zIndex: 1,
              }
        }
      >
        <div ref={boxRef} className="dc-map" />
      </div>
    </>
  );
}