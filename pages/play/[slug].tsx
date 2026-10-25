// daviscaruso.com/play/<business-slug>
// Logs one tap for that business, then sends the visitor straight to the Spotify playlist.
import type { GetServerSideProps } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

// Link previews (iMessage, Slack, Instagram DMs, etc.) "visit" the link too.
// Skip counting those so the numbers reflect real taps.
const PREVIEW_BOTS =
  /bot|crawler|spider|preview|facebookexternalhit|slackbot|twitterbot|discordbot|whatsapp|telegrambot|linkedinbot|embedly|skypeuripreview|vercel-screenshot/i;

export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const slug = String(params?.slug ?? "").toLowerCase().trim();
  const fallbackUrl = process.env.SPOTIFY_PLAYLIST_URL || "https://open.spotify.com";
  let destination = fallbackUrl;

  // Never cache this redirect, or repeat taps won't reach the server
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const { data: business } = await supabaseAdmin
      .from("playlist_businesses")
      .select("slug, spotify_url, active")
      .eq("slug", slug)
      .maybeSingle();

    if (business?.spotify_url) destination = business.spotify_url;

    const userAgent = req.headers["user-agent"] ?? "";
    const isPreview = PREVIEW_BOTS.test(userAgent);
    const shouldCount = slug && !isPreview && business?.active !== false;

    if (shouldCount) {
      await supabaseAdmin.from("playlist_taps").insert({
        business_slug: slug, // logged even if you haven't added the business yet
        country: (req.headers["x-vercel-ip-country"] as string) ?? null,
        user_agent: userAgent.slice(0, 300),
        referrer: ((req.headers["referer"] as string) ?? "").slice(0, 300) || null,
      });
    }
  } catch (err) {
    // Tracking problems should never stop the music
    console.error("playlist tap logging failed", err);
  }

  return { redirect: { destination, permanent: false } };
};

export default function PlayRedirect() {
  return null;
}