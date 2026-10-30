import { useEffect, useState } from "react";
import Head from "next/head";

const PLATFORMS = [
  {
    id: "spotify",
    name: "Spotify",
    url: "https://open.spotify.com/playlist/0hJLYz915N9gNhfEiUONDV",
  },
  {
    id: "apple",
    name: "Apple Music",
    url: "https://music.apple.com/us/playlist/localmusic-a2/pl.u-2aoqqvbiNZjryE",
  },
  {
    id: "tidal",
    name: "Tidal",
    url: "https://tidal.com/playlist/5934d097-3a49-48e4-8003-7508b1138420",
  },
];

const COPY = {
  en: {
    eyebrow: "THE LOCAL PLAYLIST",
    title: "Listen local",
    blurb:
      "Singer-songwriters from around town, curated for the shops and cafés that keep our neighborhoods humming.",
    choose: "Choose where you listen",
    listenOn: "Listen on",
    back: "← back to the story",
  },
  es: {
    eyebrow: "LA PLAYLIST LOCAL",
    title: "Escucha local",
    blurb:
      "Cantautores de nuestra ciudad, seleccionados para las tiendas y cafés que mantienen vivos nuestros barrios.",
    choose: "Elige dónde escuchar",
    listenOn: "Escuchar en",
    back: "← volver a la historia",
  },
};

export default function LocalPlaylist() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es")) {
      setLang("es");
    }
    const t = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  const t = COPY[lang];

  return (
    <>
      <Head>
        <title>Local Playlist · Davis Caruso</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="page-border" aria-hidden="true" />

      <main className={`picker-page ${fadeIn ? "fade-in" : ""}`}>
        <button
          type="button"
          className="lang-toggle"
          onClick={() => setLang(lang === "en" ? "es" : "en")}
          aria-label={lang === "en" ? "Ver en español" : "View in English"}
        >
          {lang === "en" ? "ES" : "EN"}
        </button>

        <div className="inner">
          <div className="ornament">
            <span className="line" />
            <span className="star">✦</span>
            <span className="line" />
          </div>

          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="blurb">{t.blurb}</p>

          <p className="choose">{t.choose}</p>

          <ul className="platforms">
            {PLATFORMS.map((p) => (
              <li key={p.id}>
                <a
                  className="platform"
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="listen-on">{t.listenOn}</span>
                  <span className="platform-name">{p.name}</span>
                  <span className="arrow" aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="ornament bottom">
            <span className="line" />
            <span className="star">✦</span>
            <span className="line" />
          </div>

          <a href="/story" className="back-link">
            {t.back}
          </a>
        </div>
      </main>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          background: #e9b9b8;
        }
        body {
          overflow-x: hidden;
        }
      `}</style>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .picker-page {
          --lavender: #9680b8;
          --lavender-dark: #715a99;
          --pink: #e16d99;
          --gold: #d4ad56;
          --bandana-soft: #e9b9b8;
          --bandana-light: #f3d7d3;

          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(5rem, 10vw, 8rem) 1.5rem;
          opacity: 0;
          color: var(--lavender-dark);
          font-family: "Fraunces", Georgia, serif;
          background:
            radial-gradient(circle at 50% 0%, rgba(255, 247, 244, 0.58), transparent 45%),
            linear-gradient(180deg, var(--bandana-light) 0%, var(--bandana-soft) 100%);
          transition: opacity 1.35s ease;
        }

        .picker-page::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.075;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 300px 300px;
          mix-blend-mode: multiply;
        }

        .picker-page.fade-in {
          opacity: 1;
        }

        .inner {
          position: relative;
          z-index: 1;
          width: min(100%, 520px);
          text-align: center;
        }

        .lang-toggle {
          position: absolute;
          top: 2rem;
          right: 2rem;
          z-index: 2;
          padding: 0.45rem 0.75rem;
          border: 1px solid rgba(150, 128, 184, 0.55);
          border-radius: 999px;
          background: none;
          color: var(--lavender);
          font-family: "Fraunces", Georgia, serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          cursor: pointer;
        }

        .ornament {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.2rem;
          margin: 0 auto 2.5rem;
        }

        .ornament.bottom {
          margin: 3.5rem auto 2rem;
        }

        .line {
          width: 90px;
          height: 1px;
          background: rgba(150, 128, 184, 0.4);
        }

        .star {
          color: var(--pink);
          font-size: 1.4rem;
          line-height: 1;
        }

        .eyebrow {
          margin: 0;
          color: var(--pink);
          font-size: 0.76rem;
          font-weight: 600;
          letter-spacing: 0.23em;
        }

        h1 {
          margin: 0.4rem 0 1.5rem;
          color: var(--lavender);
          font-size: clamp(3.2rem, 10vw, 5.4rem);
          font-weight: 500;
          line-height: 0.95;
          letter-spacing: -0.025em;
        }

        .blurb {
          margin: 0 auto 3rem;
          max-width: 440px;
          font-size: clamp(1.1rem, 2.4vw, 1.3rem);
          line-height: 1.5;
        }

        .choose {
          margin: 0 0 1.2rem;
          color: var(--pink);
          font-size: 1.05rem;
          font-style: italic;
        }

        .platforms {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .platform {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: baseline;
          gap: 0.75rem;
          padding: 1.15rem 1.5rem;
          border: 1px solid rgba(150, 128, 184, 0.45);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.22);
          color: var(--lavender-dark);
          text-decoration: none;
          text-align: left;
          transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }

        .platform:hover,
        .platform:focus-visible {
          background: rgba(255, 255, 255, 0.45);
          border-color: var(--gold);
          transform: translateY(-1px);
        }

        .listen-on {
          color: var(--pink);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .platform-name {
          font-size: 1.35rem;
          font-weight: 500;
        }

        .arrow {
          color: var(--lavender);
          font-size: 1.2rem;
        }

        .back-link {
          color: var(--lavender);
          font-size: 1rem;
          font-style: italic;
          text-decoration: none;
        }

        .back-link:hover {
          color: var(--pink);
        }

        .page-border {
          position: fixed;
          inset: 11px;
          z-index: 9999;
          pointer-events: none;
          border: 1px solid rgba(212, 173, 86, 0.55);
        }

        @media (max-width: 600px) {
          .lang-toggle {
            top: 1.25rem;
            right: 1.25rem;
          }
          .platform {
            padding: 1rem 1.25rem;
          }
          .platform-name {
            font-size: 1.2rem;
          }
          .page-border {
            inset: 6px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .picker-page {
            transition: none;
          }
          .platform {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}