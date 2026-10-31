// components/ExploreMenu.tsx
// A small three-line (hamburger) dropdown, centered at the top of the gallery page:
// Updates and upcoming shows (/story), Map of La Famiglia, then any event flyer
// marked show_in_menu in the Supabase `flyers` table (e.g. Morning Movement).
// Usage (in pages/gallery.tsx):  import ExploreMenu from "../components/ExploreMenu";
//                                 ...then render <ExploreMenu /> anywhere in the page.
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLang } from "./i18n";

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
    aria: "Menu",
  },
  es: {
    story: "Novedades y próximos shows",
    map: "Mapa de La Famiglia",
    aria: "Menú",
  },
} as const;

export default function ExploreMenu() {
  const { lang } = useLang();
  const c = COPY[lang === "es" ? "es" : "en"];
  const [open, setOpen] = useState(false);
  const [small, setSmall] = useState(false); // phones
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [flyers, setFlyers] = useState<MenuFlyer[]>([]);

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

  // Phones get a compact button; desktop keeps the big one
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setSmall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
    { href: `/story?lang=${lang}`, label: c.story },
    { href: `/welcome-map?lang=${lang}`, label: c.map },
    ...flyers.map((f) => ({
      href: `/events/${f.slug}?lang=${lang}`,
      label:
        (lang === "es" && f.menu_label_es) || f.menu_label || f.title,
    })),
  ];

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
          width: small ? 52 : "min(230px, 42vw)",
          height: small ? 52 : "min(230px, 42vw)",
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
                padding: small ? "14px 18px" : "18px 20px",
                color: "#715a99",
                textDecoration: "none",
                textAlign: "center",
                whiteSpace: "nowrap",
                fontSize: small ? 17 : 19,
                borderTop: i ? "1px solid rgba(212,173,86,0.35)" : "none",
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}