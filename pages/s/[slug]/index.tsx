// pages/s/[slug].tsx
// Ad landing pages: daviscaruso.com/s/pom-reddit, /s/<any slug>, ...
// Each one is a row in the Supabase `ad_landings` table (see
// supabase/ad_landings.sql): the same video clip the ad ran, so the page
// feels like the ad continuing, then the email signup for one specific
// unreleased song. Signups show up at /signup-stats under the slug
// (or under ?src= if the ad link has one).
import { useEffect, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import WelcomePopup from "../../../components/WelcomePopup";
import { useLang, type Lang } from "../../../components/i18n";
import { detectExtraLang, type AdLang, type ExtraLang } from "../../../lib/adLang";
import { setSourceIfUnknown } from "../../../lib/signupTracking";
import { AD_CLIP_BUCKET, getAdLanding, type AdPlatform } from "../../../lib/adLandings";
import { trackRedditCustom } from "../../../lib/redditPixel";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { songTitle } from "../../../lib/songs";

type Props = {
  slug: string;
  clipUrl: string;
  songName: string;
  headline: Record<Lang, string>;
  epName: string | null;
  // Only the platforms that have a link filled in, in this order
  streams: AdPlatform[];
};

const PLATFORM_LABEL: Record<AdPlatform, string> = {
  spotify: "Spotify",
  apple: "Apple Music",
  youtube: "YouTube",
};

const COPY: Record<
  AdLang,
  {
    sound: string;
    soundOn: string;
    gallery: string;
    listenEp: (ep: string) => string;
    listenAll: string;
    epNote: string;
    more: string;
  }
> = {
  en: {
    listenEp: (ep) => `Hear the whole ${ep} EP`,
    listenAll: "Hear the whole EP",
    epNote: "5 songs · out now",
    more: "And if you want one more…",
    sound: "🔊 Tap for sound",
    soundOn: "🔇 Mute",
    gallery: "Explore the gallery →",
  },
  es: {
    listenEp: (ep) => `Escucha todo el EP ${ep}`,
    listenAll: "Escucha todo el EP",
    epNote: "5 canciones · ya disponible",
    more: "Y si quieres una más…",
    sound: "🔊 Toca para activar el sonido",
    soundOn: "🔇 Silenciar",
    gallery: "Explora la galería →",
  },
  pt: {
    listenEp: (ep) => `Ouça o EP ${ep} completo`,
    listenAll: "Ouça o EP completo",
    epNote: "5 músicas · já disponível",
    more: "E se você quiser mais uma…",
    sound: "🔊 Toque para ativar o som",
    soundOn: "🔇 Silenciar",
    gallery: "Explore a galeria →",
  },
  id: {
    listenEp: (ep) => `Dengarkan EP ${ep} selengkapnya`,
    listenAll: "Dengarkan EP selengkapnya",
    epNote: "5 lagu · sudah rilis",
    more: "Dan kalau mau satu lagi…",
    sound: "🔊 Ketuk untuk suara",
    soundOn: "🔇 Bisukan",
    gallery: "Jelajahi galeri →",
  },
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, res }) => {
  const ad = await getAdLanding(params?.slug);
  if (!ad) return { notFound: true };

  // Temporary link, so this works whether or not the bucket is public
  const { data } = await supabaseAdmin.storage
    .from(AD_CLIP_BUCKET)
    .createSignedUrl(ad.clip_file, 6 * 60 * 60);
  if (!data?.signedUrl) {
    console.error(`ad-clips: couldn't find "${ad.clip_file}"`);
    return { notFound: true };
  }

  res.setHeader("Cache-Control", "no-store");

  return {
    props: {
      slug: ad.slug,
      clipUrl: data.signedUrl,
      songName: songTitle(ad.song_file),
      headline: {
        en: ad.headline_en ?? "",
        es: ad.headline_es ?? ad.headline_en ?? "",
      },
      epName: ad.ep_name,
      streams: (["spotify", "apple", "youtube"] as AdPlatform[]).filter((p) =>
        /^https:\/\//.test(ad[`${p}_url`] ?? "")
      ),
    },
  };
};

export default function AdLanding({
  slug,
  clipUrl,
  songName,
  headline,
  epName,
  streams,
}: Props) {
  const { lang: siteLang, setLang: setSiteLang } = useLang();
  // Portuguese / Indonesian phones get those languages; EN / ES buttons still work
  const [extra, setExtra] = useState<ExtraLang | null>(null);
  const [useExtra, setUseExtra] = useState(true);
  useEffect(() => setExtra(detectExtraLang()), []);
  const lang: AdLang = extra && useExtra ? extra : siteLang;
  const langOptions: AdLang[] = extra ? [extra, "en", "es"] : ["en", "es"];
  const changeLang = (l: AdLang) => {
    if (l === extra) {
      setUseExtra(true);
    } else if (l === "en" || l === "es") {
      setUseExtra(false);
      setSiteLang(l);
    }
  };
  const c = COPY[lang];
  const headlineText = lang === "en" || lang === "es" ? headline[lang] : headline.en;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [location, setLocation] = useState("");

  // Count this page as its own source before the signup card logs "shown"
  // (runs during the first render on the visitor's device, before any effects)
  useState(() => {
    if (typeof window !== "undefined") setSourceIfUnknown(slug);
    return null;
  });

  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d) => {
        if (d?.location) setLocation(String(d.location));
      })
      .catch(() => {});
  }, []);

  // Phones only autoplay muted video, so sound waits for a tap.
  // Turning it on restarts the clip so they hear it from the top.
  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    if (muted) {
      v.muted = false;
      v.currentTime = 0;
      v.play().catch(() => {});
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
  };

  return (
    <>
      <Head>
        <title>{`${songName} · Davis Caruso`}</title>
        <meta name="description" content={headline.en || songName} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className="ad-page">
        <p className="name">DAVIS CARUSO</p>
        {headlineText && <p className="headline">{headlineText}</p>}

        <div className="clip">
          <video
            ref={videoRef}
            src={clipUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onClick={toggleSound}
          />
          <button type="button" className="sound" onClick={toggleSound}>
            {muted ? c.sound : c.soundOn}
          </button>
        </div>

        {streams.length > 0 && (
          <section className="streams">
            <h2>{epName ? c.listenEp(epName) : c.listenAll}</h2>
            <p className="ep-note">{c.epNote}</p>
            <div className="stream-buttons">
              {streams.map((p) => (
                <a
                  key={p}
                  href={`/s/${slug}/${p}`}
                  className={`stream ${p}`}
                  onClick={() => trackRedditCustom("Stream Click", { platform: p })}
                >
                  {PLATFORM_LABEL[p]}
                </a>
              ))}
            </div>
          </section>
        )}

        {streams.length > 0 && <p className="more">{c.more}</p>}

        <WelcomePopup
          variant="inline"
          location={location}
          adSlug={slug}
          songName={songName}
          langOverride={lang}
          langOptions={langOptions}
          onLangChange={changeLang}
        />

        <Link href="/gallery" className="gallery-link">
          {c.gallery}
        </Link>
      </main>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          background: #f7efe9;
        }
      `}</style>

      <style jsx>{`
        .ad-page {
          min-height: 100vh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2rem;
          padding: 1.6rem 1rem 2.5rem;
          background: radial-gradient(
              circle at 50% 0%,
              rgba(255, 247, 244, 0.7),
              transparent 50%
            ),
            linear-gradient(180deg, #f7efe9 0%, #f3d7d3 100%);
          font-family: "Fraunces", Georgia, serif;
          color: #715a99;
          text-align: center;
        }

        .name {
          margin: 0;
          color: #e16d99;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.3em;
        }

        .headline {
          margin: 0;
          max-width: 440px;
          font-size: 1.1rem;
          font-style: italic;
          font-weight: 600;
          line-height: 1.4;
        }

        .clip {
          position: relative;
          width: 100%;
          max-width: 440px;
          border: 1px solid rgba(212, 173, 86, 0.65);
          border-radius: 4px;
          overflow: hidden;
          background: #2a2033;
          box-shadow: 0 18px 50px rgba(60, 40, 80, 0.25);
        }

        video {
          display: block;
          width: 100%;
          max-height: 62vh;
          object-fit: cover;
          cursor: pointer;
        }

        .sound {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.5rem 1rem;
          border: 0;
          border-radius: 999px;
          background: rgba(30, 20, 40, 0.65);
          backdrop-filter: blur(4px);
          color: #fffaf7;
          font-family: inherit;
          font-size: 0.85rem;
          white-space: nowrap;
          cursor: pointer;
        }

        .streams {
          width: 100%;
          max-width: 440px;
        }

        .streams h2 {
          margin: 0.3rem 0 0.2rem;
          font-size: 1.35rem;
          font-style: italic;
          font-weight: 600;
        }

        .ep-note {
          margin: 0 0 0.9rem;
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .stream-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .stream {
          display: block;
          padding: 0.95rem 1rem;
          border-radius: 4px;
          color: #fffaf7;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.08em;
        }

        .stream.spotify {
          background: #1db954;
          color: #0b2614;
        }

        .stream.apple {
          background: linear-gradient(135deg, #fa5c78, #e8364f);
        }

        .stream.youtube {
          background: #e62117;
        }

        .more {
          margin: 0.8rem 0 -0.4rem;
          font-size: 0.95rem;
          font-style: italic;
        }

        .ad-page :global(.gallery-link) {
          color: #9680b8;
          font-size: 0.9rem;
          text-underline-offset: 3px;
        }
      `}</style>
    </>
  );
}
