"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import type { FanPin } from "./MapView";
import { MOODS } from "./moods";
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

// Same endpoint the gallery's "A song for you" popup uses, so map emails land
// in the same list, get the same confirmation email, and share one duplicate
// check (pages/api/claim-song.ts).
const SIGNUP_ENDPOINT = "/api/claim-song";
// Set on this device once someone has signed up, so we don't ask twice.
const SUBSCRIBED_KEY = "dc_subscribed";

// Trim + lowercase so "Dav@Gmail.com " and "dav@gmail.com" are the same person
const normalizeEmail = (s: string) => s.trim().toLowerCase();
const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

type EmailResult = "sent" | "failed" | null;

// Error codes sent back by /api/fan-pins -> translated message keys
const SERVER_ERRORS: Record<string, ErrKey> = {
  name: "errName",
  city: "errCity",
  story: "errStory",
  mood: "errMood",
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
  fontSize: 16,
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

async function geocode(q: string, lang: Lang, signal?: AbortSignal): Promise<Place[]> {
  // 1) Open-Meteo matches on the city NAME only, so "Ann Arbor, MI" finds
  //    nothing. Search with the part before the first comma.
  const first = q.split(",")[0].trim();
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        first
      )}&count=6&language=${lang}&format=json`,
      { signal }
    );
    const j = await r.json();
    const found: Place[] = (j.results ?? []).map((p: any) => ({
      name: p.name,
      region: p.admin1 ?? null,
      country: p.country ?? null,
      latitude: p.latitude,
      longitude: p.longitude,
    }));
    if (found.length) return found;
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    /* fall through to the backup service */
  }

  // 2) Backup: OpenStreetMap's search understands "City, State" and typos
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q
      )}&format=jsonv2&addressdetails=1&limit=6&accept-language=${lang}`,
      { signal }
    );
    const j = await r.json();
    return (Array.isArray(j) ? j : [])
      .filter((p: any) => Number.isFinite(parseFloat(p.lat)))
      .map((p: any) => {
        const a = p.address ?? {};
        return {
          name:
            a.city || a.town || a.village || a.municipality || a.hamlet ||
            a.county || p.name || q,
          region: a.state ?? null,
          country: a.country ?? null,
          latitude: parseFloat(p.lat),
          longitude: parseFloat(p.lon),
        };
      });
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    return [];
  }
}

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
  const [story, setStory] = useState(""); // the lyrics
  const [mood, setMood] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: humans never see it
  const [sending, setSending] = useState(false);
  const [errKey, setErrKey] = useState<ErrKey | null>(null);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [emailResult, setEmailResult] = useState<EmailResult>(null);
  // Hide the email field for people this device already signed up
  const [askEmail, setAskEmail] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(SUBSCRIBED_KEY)) setAskEmail(false);
    } catch {
      /* storage unavailable: just show the field */
    }
  }, []);

  // Runs after the pin is saved. A failure here never undoes the pin.
  async function subscribe(addr: string, where: string): Promise<EmailResult> {
    try {
      const r = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addr, lang, location: where }),
      });
      if (!r.ok) return "failed";
      try {
        localStorage.setItem(SUBSCRIBED_KEY, "1");
      } catch {
        /* ignore */
      }
      return "sent";
    } catch {
      return "failed";
    }
  }

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
        setResults(await geocode(q, lang, ctrl.signal));
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
    if (picked && story.trim().length < 2) return setErrKey("errStory");
    if (picked && !mood) return setErrKey("errMood");
    const addr = askEmail ? normalizeEmail(email) : "";
    if (addr && !looksLikeEmail(addr)) return setErrKey("errEmail");

    setSending(true);
    try {
      // Phones: people often type their city and press Send without tapping a
      // suggestion. Use the suggestion list, or look the city up right now.
      let place: Place | null = picked;
      if (!place) {
        const q = query.trim();
        if (q.length >= 2) {
          try {
            place = results[0] ?? (await geocode(q, lang))[0] ?? null;
          } catch {
            place = null;
          }
        }
        if (!place) {
          setErrKey("errCity");
          return;
        }
        setPicked(place);
        setQuery(placeLabel(place));
        setResults([]);
      }
      if (story.trim().length < 2) {
        setErrKey("errStory");
        return;
      }
      if (!mood) {
        setErrKey("errMood");
        return;
      }
      const res = await fetch("/api/fan-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name,
          city: place.name,
          region: place.region,
          country: place.country,
          latitude: place.latitude,
          longitude: place.longitude,
          story,
          mood,
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
          city: place.name,
          region: place.region,
          country: place.country,
          latitude: round2(place.latitude),
          longitude: round2(place.longitude),
          story: story.trim(),
          mood,
          edit_token: j.token, // lets this device change the mood later
        });
        try {
          localStorage.setItem("dc_mood_checkin", String(Date.now()));
        } catch {
          /* ignore */
        }
      }
      if (addr) setEmailResult(await subscribe(addr, placeLabel(place)));
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
            {emailResult && (
              <p
                style={{
                  color: emailResult === "failed" ? "#e8261b" : "#3b0a8c",
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}
              >
                {emailResult === "sent" ? t.emailSent : t.emailFailed}
              </p>
            )}
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
                autoCorrect="off"
                autoCapitalize="words"
                enterKeyHint="search"
              />
              {results.length > 0 && (
                <div
                  style={{
                    marginTop: 6,
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
                        padding: "12px 12px",
                        minHeight: 44,
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid rgba(59,10,140,0.2)",
                        color: "#3b0a8c",
                        fontSize: 16,
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
              style={{ ...field, minHeight: 80, resize: "vertical" }}
              value={story}
              maxLength={200}
              onChange={(e) => setStory(e.target.value)}
              placeholder={t.storyPlaceholder}
            />
            <div style={{ ...hint, textAlign: "right" }}>{story.length}/200</div>

            <div style={labelStyle}>{t.moodLabel}</div>
            <div
              role="radiogroup"
              aria-label={t.moodLabel}
              // Always two even rows of 7; buttons shrink a little on phones
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 48px))",
                gap: 8,
              }}
            >
              {MOODS.map((m) => (
                <button
                  type="button"
                  key={m}
                  role="radio"
                  aria-checked={mood === m}
                  onClick={() => setMood(m)}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    padding: 0,
                    fontSize: "clamp(20px, 5.5vw, 26px)",
                    lineHeight: 1,
                    borderRadius: 12,
                    cursor: "pointer",
                    border:
                      mood === m ? "3px solid #3b0a8c" : "2px solid rgba(59,10,140,0.25)",
                    background: mood === m ? "#ffb59a" : "#fffaf3",
                    transform: mood === m ? "scale(1.08)" : "none",
                    transition: "transform .12s",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {askEmail && (
              <>
                <label style={labelStyle} htmlFor="fan-email">
                  {t.emailLabel}
                </label>
                <input
                  id="fan-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={254}
                  style={field}
                  value={email}
                  placeholder={t.emailPlaceholder}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div style={hint}>{t.emailHint}</div>
              </>
            )}

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