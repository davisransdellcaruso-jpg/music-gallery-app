// daviscaruso.com/amore — the shareable link for the Amore EP.
// Plain link-tree: no signup in the way. The streaming URLs come from the
// active Amore ad row in `ad_landings` (smitten-reddit, then pom-reddit as a
// fallback), so they only need updating in one place.
// Taps show in Vercel Analytics as the "Amore Link" event.
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { getAdLanding } from "../lib/adLandings";
import { PROJECTS } from "../lib/releases";
import { useLang, type Lang } from "../components/i18n";

type Stream = { id: string; label: string; url: string };
type Props = { streams: Stream[]; tracks: string[] };

const SOURCE_SLUGS = ["smitten-reddit", "pom-reddit"];

const COPY: Record<Lang, { listen: string; note: string; gallery: string }> = {
  en: { listen: "Listen on", note: "EP · 5 songs · out now", gallery: "Explore the gallery →" },
  es: { listen: "Escucha en", note: "EP · 5 canciones · ya disponible", gallery: "Explora la galería →" },
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ res }) => {
  let ad = null;
  for (const s of SOURCE_SLUGS) {
    ad = await getAdLanding(s);
    if (ad && (ad.spotify_url || ad.apple_url || ad.youtube_url)) break;
  }
  const all: Stream[] = [
    { id: "spotify", label: "Spotify", url: ad?.spotify_url ?? "" },
    { id: "apple", label: "Apple Music", url: ad?.apple_url ?? "" },
    { id: "youtube", label: "YouTube", url: ad?.youtube_url ?? "" },
  ];
  const amore = PROJECTS.find((p) => p.name === "Amore");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return {
    props: {
      streams: all.filter((s) => /^https:\/\//.test(s.url)),
      tracks: amore ? amore.tracks.map((t) => t.title) : [],
    },
  };
};

export default function Amore({ streams, tracks }: Props) {
  const { lang, setLang } = useLang();
  const c = COPY[lang];
  return (
    <>
      <Head>
        <title>Amore · Davis Caruso</title>
        <meta name="description" content="Amore — the new EP from Davis Caruso. Listen on Spotify, Apple Music and YouTube." />
        <meta property="og:title" content="Amore · Davis Caruso" />
        <meta property="og:description" content="The new EP. 5 songs, out now." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className="page">
        <div className="langs">
          {(["en", "es"] as Lang[]).map((l) => (
            <button key={l} type="button" className={l === lang ? "on" : ""} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <p className="name">DAVIS CARUSO</p>
        <h1>Amore</h1>
        <p className="note">{c.note}</p>

        <ol className="tracks">
          {tracks.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>

        <div className="buttons">
          {streams.map((s) => (
            <a
              key={s.id}
              href={s.url}
              className={`stream ${s.id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("Amore Link", { platform: s.id })}
            >
              {c.listen} {s.label}
            </a>
          ))}
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
          background: #efe6f8;
        }
      `}</style>

      <style jsx>{`
        .page {
          position: relative;
          min-height: 100vh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem 1.2rem 2.5rem;
          background: radial-gradient(circle at 50% 0%, rgba(250, 243, 255, 0.7), transparent 50%),
            linear-gradient(180deg, #efe6f8 0%, #ebdffa 100%);
          font-family: "Fraunces", Georgia, serif;
          color: #5e3d92;
          text-align: center;
        }
        .langs {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.3rem;
        }
        .langs button {
          border: 1px solid rgba(94, 61, 146, 0.35);
          background: transparent;
          color: #5e3d92;
          border-radius: 3px;
          padding: 0.2rem 0.5rem;
          font-family: inherit;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .langs button.on {
          background: #5e3d92;
          color: #fdf9ff;
        }
        .name {
          margin: 0;
          color: #c45e22;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.3em;
        }
        h1 {
          margin: 0;
          font-size: 3.2rem;
          font-style: italic;
          font-weight: 600;
          line-height: 1;
        }
        .note {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.8;
        }
        .tracks {
          margin: 0.4rem 0 0.6rem;
          padding: 0;
          list-style-position: inside;
          font-size: 0.95rem;
          line-height: 1.7;
        }
        .buttons {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .stream {
          display: block;
          padding: 0.95rem 1rem;
          border-radius: 4px;
          color: #fdf9ff;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.06em;
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
        .page :global(.gallery-link) {
          margin-top: 0.8rem;
          color: #9b7fd4;
          font-size: 0.9rem;
          text-underline-offset: 3px;
        }
      `}</style>
    </>
  );
}
