// daviscaruso.com/s/<ad-slug>/spotify (or /apple, /youtube)
// The streaming buttons on an ad page go through here: one tap is logged in
// `playlist_taps` (business_slug = the ad's slug, so it shows on
// /playlist-stats), then the visitor goes straight to that platform.
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
      await supabaseAdmin.from("playlist_taps").insert({
        business_slug: ad.slug,
        platform,
        country: (req.headers["x-vercel-ip-country"] as string) ?? null,
        user_agent: userAgent.slice(0, 300),
        referrer: ((req.headers["referer"] as string) ?? "").slice(0, 300) || null,
      });
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
