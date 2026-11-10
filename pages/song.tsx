// pages/song.tsx
// The bio link page: daviscaruso.com/song?src=ig (Instagram), ?src=tt (TikTok),
// or any other short tag (?src=qr for a QR code at a show, ?src=fb, ...).
// It does one thing: offers the unreleased Periwinkle song for an email.
// Signups from here show up by source at /signup-stats.
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import WelcomePopup from "../components/WelcomePopup";
import { useLang, type Lang } from "../components/i18n";
import { getCurrentRelease } from "../lib/releases";

const PHOTO_URL =
  "https://bzllhepdcooxjekehkvc.supabase.co/storage/v1/object/public/Login%20page%20video/daviscaruso%20presents%20edit.jpg";

const COPY: Record<
  Lang,
  { meta: string; listen: string; play: string; pause: string; gallery: string }
> = {
  en: {
    meta: "An unreleased song from Periwinkle, free when you join. Ambient world soul from Ann Arbor.",
    listen: "While you're here, my newest single:",
    play: "Play",
    pause: "Pause",
    gallery: "Explore the gallery →",
  },
  es: {
    meta: "Una canción inédita de Periwinkle, gratis al unirte. Ambient world soul desde Ann Arbor.",
    listen: "Mientras estás aquí, mi sencillo más reciente:",
    play: "Reproducir",
    pause: "Pausa",
    gallery: "Explora la galería →",
  },
};

export default function SongPage() {
  const { lang } = useLang();
  const c = COPY[lang];
  const [release] = useState(getCurrentRelease);
  const [location, setLocation] = useState("");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch("/api/geo")
      .then((res) => res.json())
      .then((data) => {
        if (data?.location) setLocation(String(data.location));
      })
      .catch(() => {});
  }, []);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
      } catch {}
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <Head>
        <title>A song for you · Davis Caruso</title>
        <meta name="description" content={c.meta} />
        <meta property="og:title" content="A song for you · Davis Caruso" />
        <meta property="og:description" content={c.meta} />
        <meta property="og:image" content={PHOTO_URL} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className="song-page">
        <p className="name">DAVIS CARUSO</p>

        <WelcomePopup variant="inline" location={location} />

        <div className="listen">
          <p>{c.listen}</p>
          <button type="button" onClick={togglePlay} className="play">
            <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
            <span className="sr">{playing ? c.pause : c.play}</span>
            <span className="track">{release.title}</span>
          </button>
          <audio
            ref={audioRef}
            src={release.audioUrl}
            preload="none"
            onEnded={() => setPlaying(false)}
          />
        </div>

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
        .song-page {
          min-height: 100vh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.6rem;
          padding: 2.5rem 1rem;
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

        .listen p {
          margin: 0 0 0.6rem;
          font-size: 0.9rem;
          font-style: italic;
        }

        .play {
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.6rem 1.2rem;
          border: 1px solid rgba(150, 128, 184, 0.7);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.4);
          color: #715a99;
          font-family: inherit;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .track {
          font-style: italic;
          font-weight: 600;
        }

        .sr {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .song-page :global(.gallery-link) {
          color: #9680b8;
          font-size: 0.9rem;
          text-underline-offset: 3px;
        }
      `}</style>
    </>
  );
}
