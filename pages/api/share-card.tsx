// pages/api/share-card.tsx
// daviscaruso.com/api/share-card?id=<pin id>&t=<edit token>&lang=en|es
// A 1080×1920 (story-sized) PNG of one fan's pin on the Map of La Famiglia,
// for Instagram / TikTok stories. Approved pins work for anyone; a pin still
// waiting for approval only works with its owner's token (kept on their device).
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const config = { runtime: "edge" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COPY = {
  en: { onMap: "I'm on the map", join: "Add yourself 🦋" },
  es: { onMap: "Estoy en el mapa", join: "Agrégate 🦋" },
};

type Pin = {
  display_name: string;
  city: string;
  country: string | null;
  story: string;
  mood: string | null;
  approved: boolean;
  edit_token_hash: string | null;
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Fraunces from Google Fonts (TrueType). If it can't load, the default font is used.
async function loadFonts() {
  try {
    const css = await (
      await fetch("https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,600")
    ).text();
    const faces = [...css.matchAll(/font-style: (normal|italic);[\s\S]*?src: url\((.+?)\) format\('(?:truetype|opentype)'\)/g)];
    const fonts = await Promise.all(
      faces.map(async ([, style, url]) => ({
        name: "Fraunces",
        data: await (await fetch(url)).arrayBuffer(),
        weight: 600 as const,
        style: style as "normal" | "italic",
      }))
    );
    return fonts.length ? fonts : undefined;
  } catch {
    return undefined;
  }
}

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  const token = searchParams.get("t") ?? "";
  const lang = searchParams.get("lang") === "es" ? "es" : "en";
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return new Response("Not configured", { status: 500 });

  const r = await fetch(
    `${base}/rest/v1/fan_pins?id=eq.${id}&select=display_name,city,country,story,mood,approved,edit_token_hash`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const pin = ((await r.json().catch(() => [])) as Pin[])[0];
  if (!pin) return new Response("Not found", { status: 404 });
  if (!pin.approved) {
    if (!token || !pin.edit_token_hash || (await sha256(token)) !== pin.edit_token_hash) {
      return new Response("Not found", { status: 404 });
    }
  }

  const c = COPY[lang];
  const place = [pin.city, pin.country].filter(Boolean).join(", ");
  const lyricSize = pin.story.length > 120 ? 44 : pin.story.length > 60 ? 52 : 62;
  const fonts = await loadFonts();
  const serif = fonts ? "Fraunces" : "serif";

  // Little caterpillars and butterflies scattered around the edges
  const critters: [string, number, number, number][] = [
    ["🦋", 90, 330, 64], ["🐛", 900, 380, 44], ["🐛", 140, 1500, 40],
    ["🦋", 880, 1440, 72], ["🐛", 300, 560, 34], ["🦋", 60, 980, 48],
    ["🐛", 960, 1050, 38], ["🦋", 470, 1580, 44],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "120px 80px 110px",
          background: "linear-gradient(180deg, #f6effc 0%, #e6d6f7 55%, #d9c3f1 100%)",
          color: "#53288f",
          fontFamily: serif,
          position: "relative",
        }}
      >
        {critters.map(([e, x, y, s], i) => (
          <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: s, opacity: 0.85, display: "flex" }}>
            {e}
          </div>
        ))}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 34, letterSpacing: 12, color: "#c45e22", display: "flex" }}>DAVIS CARUSO</div>
          <div style={{ fontSize: 96, fontStyle: "italic", marginTop: 28, display: "flex" }}>Map of La Famiglia</div>
          <div style={{ fontSize: 44, marginTop: 14, color: "#7e57c9", display: "flex" }}>{c.onMap} 🌎</div>
        </div>

        <div
          style={{
            width: 880,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "64px 60px",
            background: "#f2eafa",
            border: "6px solid #53288f",
            borderRadius: 40,
            boxShadow: "18px 18px 0 #e8762c",
          }}
        >
          <div style={{ fontSize: 130, lineHeight: 1, display: "flex" }}>{pin.mood || "💜"}</div>
          <div style={{ fontSize: 76, marginTop: 30, display: "flex" }}>{pin.display_name}</div>
          <div style={{ fontSize: 38, marginTop: 8, color: "#7e57c9", display: "flex" }}>📍 {place}</div>
          <div
            style={{
              fontSize: lyricSize,
              fontStyle: "italic",
              lineHeight: 1.35,
              marginTop: 44,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {`“${pin.story}”`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 40, color: "#c45e22", display: "flex" }}>{c.join}</div>
          <div style={{ fontSize: 46, marginTop: 10, display: "flex" }}>daviscaruso.com/welcome-map</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts,
      emoji: "twemoji",
      headers: { "Cache-Control": pin.approved ? "public, max-age=300" : "private, no-store" },
    }
  );
}
