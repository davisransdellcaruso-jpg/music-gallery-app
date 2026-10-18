// components/ExploreMenu.tsx
// A small dropdown for the gallery page: Story, Welcome map, Listener map.
// Usage (in pages/gallery.tsx):  import ExploreMenu from "../components/ExploreMenu";
//                                 ...then render <ExploreMenu /> anywhere in the page.
import { useEffect, useRef, useState } from "react";
import { useLang } from "./i18n";

const COPY = {
  en: {
    button: "Explore",
    story: "The story",
    welcome: "Welcome map",
    listener: "Listener map",
    aria: "Explore the site",
  },
  es: {
    button: "Explorar",
    story: "La historia",
    welcome: "Mapa de bienvenida",
    listener: "Mapa de oyentes",
    aria: "Explorar el sitio",
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
    { href: `/welcome-map?lang=${lang}`, label: c.welcome },
    { href: `/listener-map?lang=${lang}`, label: c.listener },
  ];

  return (
    <div
      ref={boxRef}
      style={{
        position: "fixed",
        top: 14,
        left: 14,
        zIndex: 2000,
        fontFamily: "inherit",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={c.aria}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          borderRadius: 999,
          border: "1px solid rgba(212,173,86,0.75)",
          background: "rgba(251,245,240,0.92)",
          color: "#715a99",
          fontSize: 15,
          letterSpacing: "0.04em",
          cursor: "pointer",
          backdropFilter: "blur(6px)",
        }}
      >
        <span>{c.button}</span>
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            fontSize: 11,
            transition: "transform .18s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          ▼
        </span>
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