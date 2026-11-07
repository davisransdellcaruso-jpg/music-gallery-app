// components/ExploreMenu.tsx
// A small three-line (hamburger) dropdown, centered at the top of the gallery page:
// Updates and upcoming shows (/story), Map of La Famiglia, any event flyer
// marked show_in_menu in the Supabase `flyers` table (e.g. Morning Movement),
// and an "About" item that opens a short bio right inside the menu.
// Usage (in pages/gallery.tsx):  import ExploreMenu from "../components/ExploreMenu";
//                                 ...then render <ExploreMenu /> anywhere in the page.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import { useLang } from "./i18n";
import { trackRedditCustom } from "../lib/redditPixel";

type MenuFlyer = {
  slug: string;
  menu_label: string | null;
  menu_label_es: string | null;
  title: string;
};

const COPY = {
  en: {
    story: "Updates and upcoming shows",
    map: "Map of La Famiglia",
    about: "About",
    aria: "Menu",
    live: "● Live now",
    photoAlt: "Davis Caruso smiling beside a sunflower",
    bio: [
      "Davis Caruso is a lover of art and creativity, inspired to build community around his passions for music and dance. Davis has been songwriting since childhood and more recently started to record, produce and perform with his growing network. His musical expression is rooted in empathy and deep listening, describing his sound as “ambient world soul”: music that often exists in open spaces while preserving a sense of intimacy.",
      "Through his work, Davis hopes to help others unlock their creative potential and build lives they feel truly energized to live, imagining our worlds becoming more beautiful and harmonious as we meet our needs doing what we love.",
    ],
  },
  es: {
    story: "Novedades y próximos shows",
    map: "Mapa de La Famiglia",
    about: "Sobre Davis",
    aria: "Menú",
    live: "● En vivo ahora",
    photoAlt: "Davis Caruso sonriendo junto a un girasol",
    bio: [
      "Davis Caruso es un amante del arte y la creatividad, inspirado a construir comunidad en torno a sus pasiones: la música y el baile. Davis compone canciones desde niño y, más recientemente, comenzó a grabar, producir y presentarse en vivo junto a su creciente red de colaboradores. Su expresión musical está arraigada en la empatía y la escucha profunda, y describe su sonido como “ambient world soul”: una música que suele habitar espacios abiertos sin perder una sensación de intimidad.",
      "A través de su trabajo, Davis espera ayudar a otros a descubrir su potencial creativo y construir vidas que de verdad les llenen de energía, imaginando que nuestros mundos se vuelven más bellos y armoniosos a medida que satisfacemos nuestras necesidades haciendo lo que amamos.",
    ],
  },
} as const;

export default function ExploreMenu() {
  const { lang, setLang } = useLang();
  const c = COPY[lang === "es" ? "es" : "en"];
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [small, setSmall] = useState(false); // phones
  const [wide, setWide] = useState(false); // desktop
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [flyers, setFlyers] = useState<MenuFlyer[]>([]);
  const [liveNow, setLiveNow] = useState(false);

  // "Live now" link: shows only while live_stream.is_live is true (re-checked every minute)
  useEffect(() => {
    let cancelled = false;
    const check = () =>
      supabase
        .from("live_stream")
        .select("is_live, youtube_video_id")
        .eq("id", 1)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled) setLiveNow(!!data?.is_live && !!data?.youtube_video_id);
        });
    check();
    const t = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Event flyers: add a row in Supabase with show_in_menu = true and
  // published = true, and it appears here. No code change needed.
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("flyers")
      .select("slug, menu_label, menu_label_es, title")
      .eq("show_in_menu", true)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled && data) setFlyers(data as MenuFlyer[]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Phones get a compact button, desktop a medium one, tablets keep the big one
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 640px)");
    const desk = window.matchMedia("(min-width: 1101px)");
    const update = () => {
      setSmall(phone.matches);
      setWide(desk.matches);
    };
    update();
    phone.addEventListener("change", update);
    desk.addEventListener("change", update);
    return () => {
      phone.removeEventListener("change", update);
      desk.removeEventListener("change", update);
    };
  }, []);

  // The bio folds back up whenever the menu closes
  useEffect(() => {
    if (!open) setAboutOpen(false);
  }, [open]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = [
    ...(liveNow ? [{ href: `/live?lang=${lang}`, label: c.live }] : []),
    { href: `/story?lang=${lang}`, label: c.story },
    { href: `/welcome-map?lang=${lang}`, label: c.map },
    ...flyers.map((f) => ({
      href: `/events/${f.slug}?lang=${lang}`,
      label:
        (lang === "es" && f.menu_label_es) || f.menu_label || f.title,
    })),
  ];

  const buttonSize = small ? 52 : wide ? 96 : "min(230px, 42vw)";
  const rowPadding = small ? "14px 18px" : "18px 20px";
  const rowFont = small ? 17 : 19;
  const divider = "1px solid rgba(212,173,86,0.35)";

  return (
    <div
      ref={boxRef}
      style={{
        position: "fixed",
        top: small ? 16 : 22,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2000,
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={c.aria}
        style={{
          width: buttonSize,
          height: buttonSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: "1px solid rgba(212,173,86,0.75)",
          background: "rgba(251,245,240,0.92)",
          color: "#715a99",
          cursor: "pointer",
          padding: 0,
          backdropFilter: "blur(6px)",
        }}
      >
        <svg width={small ? 26 : "50%"} height={small ? 26 : "50%"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            marginTop: small ? 6 : 8,
            minWidth: "min(320px, 80vw)",
            maxWidth: "min(440px, 88vw)",
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(212,173,86,0.75)",
            background: "rgba(251,245,240,0.97)",
            boxShadow: "0 8px 28px rgba(113,90,153,0.25)",
          }}
        >
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              role="menuitem"
              style={{
                display: "block",
                padding: rowPadding,
                color: "#715a99",
                textDecoration: "none",
                textAlign: "center",
                whiteSpace: "nowrap",
                fontSize: rowFont,
                borderTop: i ? divider : "none",
              }}
            >
              {l.label}
            </a>
          ))}

          <button
            type="button"
            role="menuitem"
            aria-expanded={aboutOpen}
            aria-controls="explore-menu-bio"
            onClick={() => {
              // Reddit Pixel: count opens only, not closes
              if (!aboutOpen) trackRedditCustom("About View");
              setAboutOpen(!aboutOpen);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: rowPadding,
              color: "#715a99",
              background: "none",
              border: "none",
              borderTop: divider,
              textAlign: "center",
              fontSize: rowFont,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {c.about}
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                fontSize: "0.7em",
                color: "#e16d99",
                transition: "transform 0.2s ease",
                transform: aboutOpen ? "rotate(180deg)" : "none",
              }}
            >
              ▾
            </span>
          </button>

          {aboutOpen && (
            <div
              id="explore-menu-bio"
              style={{
                maxHeight: "55vh",
                overflowY: "auto",
                padding: small ? "4px 20px 18px" : "6px 26px 22px",
                color: "#715a99",
                fontSize: small ? 15 : 16,
                lineHeight: 1.6,
                textAlign: "left",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  textAlign: "center",
                  color: "#e16d99",
                  fontSize: 14,
                  margin: "0 0 10px",
                }}
              >
                ✦
              </div>
              {c.bio.map((p, i) => (
                <p key={i} style={{ margin: i ? "12px 0 0" : 0 }}>
                  {p}
                </p>
              ))}

              {/* Portrait underneath the bio (public/images/about.jpg) */}
              <div
                style={{
                  marginTop: 18,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid rgba(212,173,86,0.55)",
                  boxShadow: "0 6px 18px rgba(113,90,153,0.18)",
                }}
              >
                <Image
                  src="/images/about.jpg"
                  alt={c.photoAlt}
                  width={1080}
                  height={1350}
                  sizes="(max-width: 640px) 80vw, 390px"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            </div>
          )}

          {/* Language switch */}
          <div
            role="group"
            aria-label="Language / Idioma"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              padding: small ? "12px 18px" : "14px 20px",
              borderTop: divider,
              fontSize: small ? 15 : 16,
              letterSpacing: "0.04em",
            }}
          >
            {(["en", "es"] as const).map((l, i) => {
              const active = lang === l;
              return (
                <span key={l} style={{ display: "contents" }}>
                  {i > 0 && (
                    <span aria-hidden="true" style={{ color: "rgba(212,173,86,0.9)" }}>
                      ·
                    </span>
                  )}
                  <button
                    type="button"
                    lang={l}
                    aria-pressed={active}
                    onClick={() => setLang(l)}
                    style={{
                      padding: "2px 4px",
                      border: "none",
                      background: "none",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      letterSpacing: "inherit",
                      cursor: active ? "default" : "pointer",
                      color: active ? "#e16d99" : "#9680b8",
                      fontWeight: active ? 600 : 400,
                      textDecoration: active ? "underline" : "none",
                      textUnderlineOffset: 4,
                    }}
                  >
                    {l === "en" ? "English" : "Español"}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}