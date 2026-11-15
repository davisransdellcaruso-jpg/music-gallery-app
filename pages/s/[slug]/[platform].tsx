// daviscaruso.com/s/<ad-slug>/spotify (or /apple, /youtube)
// The streaming buttons on an ad page go through here: one tap is logged in
// `ad_taps` (kept apart from the business playlist's `playlist_taps`, and
// shown on /ad-stats), then the visitor goes straight to that platform.
import type { GetServerSideProps } from "next";
import { AD_PLATFORMS, type AdPlatform, getAdLanding } from "../../../lib/adLandings";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const PREVIEW_BOTS =
  /bot|crawler|spider|preview|facebookexternalhit|slackbot|twitterbot|discordbot|whatsapp|telegrambot|linkedinbot|embedly|skypeuripreview|vercel-screenshot/i;

const COLUMN: Record<AdPlatform, "spotify_url" | "apple_url" | "youtube_url"> = {
  spotify: "spotify_url",
  apple: "apple_url",
  youtube: "youtube_url",
};

export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const platform = String(params?.platform ?? "") as AdPlatform;
  if (!AD_PLATFORMS.includes(platform)) return { notFound: true };

  const ad = await getAdLanding(params?.slug);
  const destination = ad?.[COLUMN[platform]];
  if (!ad || !destination || !/^https:\/\//.test(destination)) return { notFound: true };

  res.setHeader("Cache-Control", "no-store, max-age=0");

  const userAgent = String(req.headers["user-agent"] ?? "");
  if (!PREVIEW_BOTS.test(userAgent)) {
    try {
      const tap = {
        platform,
        country: (req.headers["x-vercel-ip-country"] as string) ?? null,
        user_agent: userAgent.slice(0, 300),
        referrer: ((req.headers["referer"] as string) ?? "").slice(0, 300) || null,
      };
      const { error } = await supabaseAdmin.from("ad_taps").insert({ ad_slug: ad.slug, ...tap });
      // Until supabase/ad_taps.sql has been run the table doesn't exist yet: park the
      // tap in playlist_taps so it isn't lost (that SQL moves these over when it runs).
      if (error) {
        console.error("ad_taps insert failed", error);
        await supabaseAdmin.from("playlist_taps").insert({ business_slug: ad.slug, ...tap });
      }
    } catch (err) {
      // Tracking problems should never stop the music
      console.error("ad stream tap logging failed", err);
    }
  }

  return { redirect: { destination, permanent: false } };
};

export default function AdStreamRedirect() {
  return null;
}
