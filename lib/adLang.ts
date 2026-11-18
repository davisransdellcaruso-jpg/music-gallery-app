// lib/adLang.ts
// Ad pages (/s/<slug>) also speak Portuguese and Indonesian, for ads running
// in Brazil and Indonesia. The rest of the site stays English / Spanish.
//
// Picked in this order: ?lang=pt|id|en|es in the link, then the visitor's
// phone language (Portuguese → pt, Indonesian → id), then the site's usual
// English / Spanish choice.
import type { Lang } from "../components/i18n";

export type AdLang = Lang | "pt" | "id";
export type ExtraLang = "pt" | "id";

export const isAdLang = (v: unknown): v is AdLang =>
  v === "en" || v === "es" || v === "pt" || v === "id";

export function detectExtraLang(): ExtraLang | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "pt" || fromUrl === "id") return fromUrl;
    if (fromUrl === "en" || fromUrl === "es") return null;
    const first = String(navigator.languages?.[0] || navigator.language || "").toLowerCase();
    if (first.startsWith("pt")) return "pt";
    // "in" is the old code some Android phones still report for Indonesian
    if (first.startsWith("id") || first.startsWith("in")) return "id";
  } catch {}
  return null;
}
