// pages/events/[slug].tsx
// One page per flyer in the `flyers` table: daviscaruso.com/events/<slug>
// Add a row in Supabase (published = true) and its page exists. No code needed.

import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { useLang, type Lang } from "@/components/i18n";

type Flyer = {
  slug: string;
  title: string;
  title_es: string | null;
  description: string;
  description_es: string | null;
  image_url: string | null;
  image_alt: string | null;
  when_text: string | null;
  when_text_es: string | null;
  location: string | null;
  location_url: string | null;
  signup_url: string | null;
};

const COPY: Record<Lang, { when: string; where: string; signup: string; back: string; map: string }> = {
  en: { when: "When", where: "Where", signup: "Save my spot", back: "← Back to the gallery", map: "Open in Maps" },
  es: { when: "Cuándo", where: "Dónde", signup: "Reservar mi lugar", back: "← Volver a la galería", map: "Abrir en Mapas" },
};

export const getServerSideProps: GetServerSideProps<{ flyer: Flyer }> = async ({ params, res }) => {
  const slug = String(params?.slug ?? "");
  const { data } = await supabase
    .from("flyers")
    .select(
      "slug, title, title_es, description, description_es, image_url, image_alt, when_text, when_text_es, location, location_url, signup_url"
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!data) return { notFound: true };
  // Short cache so edits in Supabase show up within a minute
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return { props: { flyer: data as Flyer } };
};

// Same palette as the gallery page
const LAVENDER = "#9680b8";
const LAVENDER_DARK = "#715a99";
const PINK = "#e16d99";
const GOLD = "rgba(212,173,86,0.65)";
const CREAM = "#fbf5f0";

const pill: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 3,
  border: "1px solid rgba(150,128,184,0.7)",
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.1em",
  cursor: "pointer",
};

export default function FlyerPage({ flyer }: { flyer: Flyer }) {
  const { lang, setLang } = useLang();
  const c = COPY[lang];
  const es = lang === "es";
  const title = (es && flyer.title_es) || flyer.title;
  const description = (es && flyer.description_es) || flyer.description;
  const when = (es && flyer.when_text_es) || flyer.when_text;
  const firstLine = flyer.description.split("\n")[0].slice(0, 180);

  return (
    <>
      <Head>
        <title>{`${title} · Davis Caruso`}</title>
        <meta name="description" content={firstLine} />
        {/* Nice previews when the link is shared on Instagram, texts, etc. */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={firstLine} />
        {flyer.image_url && <meta property="og:image" content={flyer.image_url} />}
      </Head>

      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500;1,9..144,600&display=swap"
        rel="stylesheet"
      />
      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #fbf5f0 0%, #f3d7d3 100%)",
          color: LAVENDER_DARK,
          padding: "28px 16px 56px",
          boxSizing: "border-box",
          fontFamily: '"Fraunces", Georgia, serif',
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <Link
              href="/gallery"
              style={{ color: LAVENDER, fontSize: 13, letterSpacing: "0.08em", textDecoration: "none", fontWeight: 600 }}
            >
              {c.back}
            </Link>
            <div style={{ display: "flex", gap: 6 }}>
              {(["en", "es"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  style={{
                    ...pill,
                    background: lang === l ? LAVENDER : "transparent",
                    color: lang === l ? CREAM : LAVENDER,
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div
            aria-hidden="true"
            style={{ textAlign: "center", color: PINK, fontSize: 22, margin: "30px 0 10px" }}
          >
            ✦
          </div>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 6vw, 2.5rem)",
              fontStyle: "italic",
              fontWeight: 600,
              lineHeight: 1.15,
              textAlign: "center",
              margin: "0 0 24px",
            }}
          >
            {title}
          </h1>

          {flyer.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flyer.image_url}
              alt={flyer.image_alt || title}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                borderRadius: 4,
                border: `1px solid ${GOLD}`,
                boxShadow: "0 24px 70px rgba(60,40,80,0.25)",
                boxSizing: "border-box",
              }}
            />
          )}

          {(when || flyer.location) && (
            <div
              style={{
                marginTop: 28,
                padding: "14px 16px",
                borderRadius: 4,
                border: `1px solid ${GOLD}`,
                background: "rgba(255,255,255,0.45)",
                display: "grid",
                gap: 8,
                fontSize: 16,
              }}
            >
              {when && (
                <div>
                  <b>{c.when}:</b> {when}
                </div>
              )}
              {flyer.location && (
                <div>
                  <b>{c.where}:</b> {flyer.location}
                  {flyer.location_url && (
                    <>
                      {" · "}
                      <a href={flyer.location_url} target="_blank" rel="noopener noreferrer" style={{ color: PINK }}>
                        {c.map}
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              fontSize: 18,
              lineHeight: 1.65,
              whiteSpace: "pre-line", // keeps the paragraph breaks from Supabase
            }}
          >
            {description}
          </div>

          {flyer.signup_url && (
            <a
              href={flyer.signup_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: 32,
                padding: "1rem 1.1rem",
                borderRadius: 3,
                background: "linear-gradient(135deg, #a08bc0, #8068a7)",
                color: "#fffaf7",
                border: "1px solid #9680b8",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textAlign: "center",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              {c.signup}
            </a>
          )}
        </div>
      </main>
    </>
  );
}