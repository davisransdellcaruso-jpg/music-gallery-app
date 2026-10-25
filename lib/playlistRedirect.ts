// Shared logic for the business playlist links.
// /play/<slug>  → Spotify      /apple/<slug> → Apple Music
// Logs one tap (business + platform), then redirects straight to that platform's playlist.
import type { GetServerSideProps } from "next";
import { supabaseAdmin } from "./supabaseAdmin";

export type Platform = "spotify" | "apple";

// Link previews (iMessage, Slack, Instagram DMs, etc.) "visit" the link too.
// Skip counting those so the numbers reflect real taps.
const PREVIEW_BOTS =
  /bot|crawler|spider|preview|facebookexternalhit|slackbot|twitterbot|discordbot|whatsapp|telegrambot|linkedinbot|embedly|skypeuripreview|vercel-screenshot/i;

const DEFAULTS: Record<Platform, () => string> = {
  spotify: () => process.env.SPOTIFY_PLAYLIST_URL || "https://open.spotify.com",
  apple: () => process.env.APPLE_MUSIC_PLAYLIST_URL || "https://music.apple.com",
};

export function playlistRedirect(platform: Platform): GetServerSideProps {
  return async ({ params, req, res }) => {
    const slug = String(params?.slug ?? "").toLowerCase().trim();
    let destination = DEFAULTS[platform]();

    // Never cache this redirect, or repeat taps won't reach the server
    res.setHeader("Cache-Control", "no-store, max-age=0");

    try {
      const { data: business } = await supabaseAdmin
        .from("playlist_businesses")
        .select("spotify_url, apple_music_url, active")
        .eq("slug", slug)
        .maybeSingle();

      const override = platform === "apple" ? business?.apple_music_url : business?.spotify_url;
      if (override) destination = override;

      const userAgent = req.headers["user-agent"] ?? "";
      const shouldCount = slug && !PREVIEW_BOTS.test(userAgent) && business?.active !== false;

      if (shouldCount) {
        await supabaseAdmin.from("playlist_taps").insert({
          business_slug: slug, // logged even if you haven't added the business yet
          platform,
          country: (req.headers["x-vercel-ip-country"] as string) ?? null,
          user_agent: userAgent.slice(0, 300),
          referrer: ((req.headers["referer"] as string) ?? "").slice(0, 300) || null,
        });
      }
    } catch (err) {
      // Tracking problems should never stop the music
      console.error(`playlist tap logging failed (${platform})`, err);
    }

    return { redirect: { destination, permanent: false } };
  };
}