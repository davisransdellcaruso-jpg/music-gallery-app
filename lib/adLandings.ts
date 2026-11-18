// lib/adLandings.ts
// Server-only: reads the `ad_landings` table (see supabase/ad_landings.sql).
// Only import this from pages/api/ or getServerSideProps.
import { supabaseAdmin } from "./supabaseAdmin";
import { SONGS } from "./songs";
import { isAdLang, type AdLang } from "./adLang";

export const AD_CLIP_BUCKET = "ad-clips";

export type AdLanding = {
  slug: string;
  clip_file: string;
  song_file: string;
  headline_en: string | null;
  headline_es: string | null;
  ep_name: string | null;
  spotify_url: string | null;
  apple_url: string | null;
  youtube_url: string | null;
  // Languages this page offers, e.g. {pt,id}. Empty / not set = English + Spanish.
  languages: AdLang[];
};

export const AD_PLATFORMS = ["spotify", "apple", "youtube"] as const;
export type AdPlatform = (typeof AD_PLATFORMS)[number];

const SLUG_RE = /^[a-z0-9-]{1,32}$/;

export async function getAdLanding(slug: unknown): Promise<AdLanding | null> {
  const s = String(slug ?? "").toLowerCase();
  if (!SLUG_RE.test(s)) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from("ad_landings")
      // "*" so the page keeps working before the streaming columns are added
      .select("*")
      .eq("slug", s)
      .eq("active", true)
      .maybeSingle();
    if (error) {
      console.error("ad_landings lookup failed:", error.message);
      return null;
    }
    if (!data) return null;
    return {
      slug: data.slug,
      clip_file: data.clip_file,
      song_file: data.song_file,
      headline_en: data.headline_en ?? null,
      headline_es: data.headline_es ?? null,
      ep_name: data.ep_name ?? null,
      spotify_url: data.spotify_url ?? null,
      apple_url: data.apple_url ?? null,
      youtube_url: data.youtube_url ?? null,
      languages: Array.isArray(data.languages)
        ? Array.from(new Set((data.languages as unknown[]).filter(isAdLang)))
        : [],
    };
  } catch (err) {
    console.error("ad_landings lookup failed:", err);
    return null;
  }
}

// Position of the ad's song in SONGS, or null if the name doesn't match a file
export function adSongIndex(ad: AdLanding | null): number | null {
  if (!ad) return null;
  const i = SONGS.indexOf(ad.song_file);
  return i >= 0 ? i : null;
}
