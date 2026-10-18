// components/ExploreMenu.tsx
// A small three-line (hamburger) dropdown, centered at the top of the gallery page:
// The story, Map of La Famiglia.
// Usage (in pages/gallery.tsx):  import ExploreMenu from "../components/ExploreMenu";
//                                 ...then render <ExploreMenu /> anywhere in the page.
import { useEffect, useRef, useState } from "react";
import { useLang } from "./i18n";

const COPY = {
  en: {
    story: "The story",
    map: "Map of La Famiglia",
    aria: "Menu",
  },
  es: {
    story: "La historia",
    map: "Mapa de La Famiglia",
    aria: "Menú",
  },
} as const;

export default function ExploreMenu() {
  const { lang } = useLang();
  const c = COPY[lang === "es" ? "es" : "en"];
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

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
  ];

  return (
    <div
      ref={boxRef}
      style={{
        position: "fixed",
        top: 22,
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
          width: 46,
          height: 46,
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
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
            marginTop: 8,
            minWidth: 190,
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
                padding: "13px 16px",
                color: "#715a99",
                textDecoration: "none",
                textAlign: "center",
                whiteSpace: "nowrap",
                fontSize: 16,
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