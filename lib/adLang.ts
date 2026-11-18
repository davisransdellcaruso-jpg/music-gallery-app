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

// Countries whose visitors get pt / id when the phone language doesn't say
export const COUNTRY_LANG: Record<string, AdLang> = {
  BR: "pt",
  PT: "pt",
  AO: "pt",
  MZ: "pt",
  ID: "id",
};

// For pages with a fixed language list (ad_landings.languages):
// ?lang= in the link, then the phone's language, then the visitor's country,
// then the first language in the list.
export function pickFromList(options: AdLang[], country: string | null): AdLang {
  const ok = (l: unknown): l is AdLang => isAdLang(l) && options.includes(l);
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (ok(fromUrl)) return fromUrl;
    for (const raw of navigator.languages ?? [navigator.language]) {
      const two = String(raw || "").toLowerCase().slice(0, 2);
      const l = two === "in" ? "id" : two;
      if (ok(l)) return l;
    }
  } catch {}
  const byCountry = country ? COUNTRY_LANG[country.toUpperCase()] : undefined;
  if (ok(byCountry)) return byCountry;
  return options[0];
}

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
