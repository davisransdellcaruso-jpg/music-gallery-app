"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import type { FanPin } from "./MapView";
import type { ErrKey, Lang, Strings } from "./i18n";

type Place = {
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
};

const placeLabel = (p: Place) =>
  [p.name, p.region, p.country].filter(Boolean).join(", ");

const round2 = (n: number) => Math.round(n * 100) / 100;

// Error codes sent back by /api/fan-pins -> translated message keys
const SERVER_ERRORS: Record<string, ErrKey> = {
  name: "errName",
  city: "errCity",
  story: "errStory",
  links: "errLinks",
  rate: "errRate",
  server: "errServer",
  invalid: "errServer",
};

const field: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 10,
  border: "2px solid #3b0a8c",
  background: "#fffaf3",
  color: "#3b0a8c",
  fontSize: 15,
  outline: "none",
  fontFamily: "inherit",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#3b0a8c",
  margin: "14px 0 6px",
};

const hint: CSSProperties = { fontSize: 12, color: "#5a2bd0", marginTop: 4 };

export default function FanPinForm({
  lang,
  t,
  onClose,
  onSubmitted,
  onContinue,
}: {
  lang: Lang;
  t: Strings;
  onClose: () => void;
  onSubmitted: (pin: FanPin) => void;
  /** Signup flow only: shown after submitting, leads on to /story */
  onContinue?: () => void;
}) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Place | null>(null);
  const [results, setResults] = useState<Place[]>([]);
  const [story, setStory] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: humans never see it
  const [sending, setSending] = useState(false);
  const [errKey, setErrKey] = useState<ErrKey | null>(null);
  const [done, setDone] = useState(false);

  // City autocomplete (Open-Meteo geocoding: free, no API key).
  // `language` makes city/country names come back in English or Spanish.
  useEffect(() => {
    const q = query.trim();
    if (picked || q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            q
          )}&count=6&language=${lang}&format=json`,
          { signal: ctrl.signal }
        );
        const j = await r.json();
        setResults(
          (j.results ?? []).map((p: any) => ({
            name: p.name,
            region: p.admin1 ?? null,
            country: p.country ?? null,
            latitude: p.latitude,
            longitude: p.longitude,
          }))
        );
      } catch {
        /* aborted or offline: ignore */
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, picked, lang]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrKey(null);
    if (!name.trim()) return setErrKey("errName");
    if (!picked) return setErrKey("errCity");
    if (story.trim().length < 10) return setErrKey("errStory");

    setSending(true);
    try {
      const res = await fetch("/api/fan-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name,
          city: picked.name,
          region: picked.region,
          country: picked.country,
          latitude: picked.latitude,
          longitude: picked.longitude,
          story,
          website,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrKey(SERVER_ERRORS[j.code] ?? "errServer");
        return;
      }
      if (j.id) {
        onSubmitted({
          id: j.id,
          display_name: name.trim(),
          city: picked.name,
          region: picked.region,
          country: picked.country,
          latitude: round2(picked.latitude),
          longitude: round2(picked.longitude),
          story: story.trim(),
        });
      }
      setDone(true);
    } catch {
      setErrKey("errNetwork");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(59,10,140,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: 22,
          borderRadius: 18,
          color: "#3b0a8c",
          background: "#f3eee6",
          border: "3px solid #3b0a8c",
          boxShadow: "6px 6px 0 #ff3d7f",
          fontFamily: "inherit",
        }}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 40 }}>💜</div>
            <h2 style={{ margin: "8px 0", fontSize: 22 }}>{t.thanksTitle}</h2>
            <p style={{ color: "#5a2bd0", lineHeight: 1.5 }}>{t.thanksBody}</p>
            {onContinue ? (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button onClick={onContinue} style={primaryBtn}>
                  {t.flowContinue}
                </button>
                <button onClick={onClose} style={ghostBtn}>
                  {t.stayOnMap}
                </button>
              </div>
            ) : (
              <button onClick={onClose} style={primaryBtn}>
                {t.backToMap}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2 style={{ margin: 0, fontSize: 22 }}>{t.formTitle}</h2>
            <p style={{ ...hint, fontSize: 13, marginTop: 6 }}>
              {t.formPrivacy}
            </p>

            <label style={labelStyle} htmlFor="fan-name">
              {t.nameLabel}
            </label>
            <input
              id="fan-name"
              style={field}
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />

            <label style={labelStyle} htmlFor="fan-city">
              {t.cityLabel}
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="fan-city"
                style={field}
                value={query}
                placeholder={t.cityPlaceholder}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPicked(null);
                }}
                autoComplete="off"
              />
              {results.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "100%",
                    marginTop: 4,
                    zIndex: 10,
                    background: "#f3eee6",
                    border: "2px solid #3b0a8c",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {results.map((p, i) => (
                    <button
                      type="button"
                      key={`${p.latitude},${p.longitude},${i}`}
                      onClick={() => {
                        setPicked(p);
                        setQuery(placeLabel(p));
                        setResults([]);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 12px",
                        background: "transparent",
                        border: "none",
                        color: "#3b0a8c",
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      {placeLabel(p)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {picked && <div style={hint}>✓ {placeLabel(picked)}</div>}

            <label style={labelStyle} htmlFor="fan-story">
              {t.storyLabel}
            </label>
            <textarea
              id="fan-story"
              style={{ ...field, minHeight: 96, resize: "vertical" }}
              value={story}
              maxLength={280}
              onChange={(e) => setStory(e.target.value)}
              placeholder={t.storyPlaceholder}
            />
            <div style={{ ...hint, textAlign: "right" }}>{story.length}/280</div>

            {/* Honeypot (hidden from people, tempting to bots) */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              style={{ position: "absolute", left: -9999, opacity: 0 }}
            />

            {errKey && (
              <div style={{ color: "#e8261b", fontSize: 14, marginTop: 10 }}>
                {t[errKey]}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="submit" disabled={sending} style={primaryBtn}>
                {sending ? t.sending : t.submit}
              </button>
              <button type="button" onClick={onClose} style={ghostBtn}>
                {t.cancel}
              </button>
            </div>
            <p style={{ ...hint, marginTop: 12 }}>{t.publicNote}</p>
          </form>
        )}
      </div>
    </div>
  );
}

const primaryBtn: CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
  color: "#f3eee6",
  background: "#ff3d7f",
  border: "2px solid #3b0a8c",
  marginTop: 6,
};

const ghostBtn: CSSProperties = {
  ...primaryBtn,
  color: "#3b0a8c",
  background: "transparent",
  border: "2px solid #3b0a8c",
};