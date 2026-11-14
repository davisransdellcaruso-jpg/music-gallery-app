// lib/adLandings.ts
// Server-only: reads the `ad_landings` table (see supabase/ad_landings.sql).
// Only import this from pages/api/ or getServerSideProps.
import { supabaseAdmin } from "./supabaseAdmin";
import { SONGS } from "./songs";

export const AD_CLIP_BUCKET = "ad-clips";

export type AdLanding = {
  slug: string;
  clip_file: string;
  song_file: string;
  headline_en: string | null;
  headline_es: string | null;
};

const SLUG_RE = /^[a-z0-9-]{1,32}$/;

export async function getAdLanding(slug: unknown): Promise<AdLanding | null> {
  const s = String(slug ?? "").toLowerCase();
  if (!SLUG_RE.test(s)) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from("ad_landings")
      .select("slug, clip_file, song_file, headline_en, headline_es")
      .eq("slug", s)
      .eq("active", true)
      .maybeSingle();
    if (error) {
      console.error("ad_landings lookup failed:", error.message);
      return null;
    }
    return data ?? null;
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
