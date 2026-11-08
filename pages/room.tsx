// /room — the supporters' private listening room (bilingual).
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";

type Track = { id: string; title: string; note: string | null; url: string };
type Lang = "en" | "es";

const T = {
  en: {
    title: "The Listening Room",
    sub: "New music, before anyone else. Thank you for being here.",
    signinIntro: "This room is for supporters. Enter your email and I'll send you a private link.",
    email: "Your email",
    send: "Send my link",
    sending: "Sending…",
    sent: "Your link is on its way. Check your inbox (and spam, just in case).",
    expired: "That link has expired. Ask for a fresh one below.",
    empty: "Nothing here yet — new songs are on the way.",
    lossless: "Lossless FLAC · headphones recommended",
    nowPlaying: "Now playing",
    studio: "Studio",
    signout: "Sign out",
    back: "Back to the gallery",
  },
  es: {
    title: "La Sala de Escucha",
    sub: "Música nueva, antes que nadie. Gracias por estar aquí.",
    signinIntro: "Esta sala es para quienes me apoyan. Escribe tu correo y te enviaré un enlace privado.",
    email: "Tu correo",
    send: "Enviar mi enlace",
    sending: "Enviando…",
    sent: "Tu enlace ya va en camino. Revisa tu bandeja (y el spam, por si acaso).",
    expired: "Ese enlace ya expiró. Pide uno nuevo aquí abajo.",
    empty: "Todavía no hay nada — vienen canciones nuevas.",
    lossless: "FLAC sin pérdida · mejor con audífonos",
    nowPlaying: "Sonando",
    studio: "Estudio",
    signout: "Salir",
    back: "Volver a la galería",
  },
};

const C = { bg: "#1c1410", panel: "#2a1f19", line: "#3d2e25", gold: "#c9a45c", text: "#efe6d8", dim: "#a8998a" };

type Listen = { trackId: string; playId: string | null; creating: boolean; seconds: number; lastTime: number; completed: boolean };

export default function Room() {
  const [lang, setLang] = useState<Lang>("en");
  const [status, setStatus] = useState<"loading" | "signin" | "ready">("loading");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [studio, setStudio] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<"idle" | "sending" | "sent">("idle");
  const [expired, setExpired] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listen = useRef<Listen | null>(null);
  const retried = useRef(false);
  const t = T[lang];

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es")) setLang("es");
    setExpired(new URLSearchParams(window.location.search).has("expired"));
  }, []);

  const loadTracks = useCallback(async () => {
    const r = await fetch("/api/room/tracks");
    if (r.status === 401) {
      setStatus("signin");
      return [] as Track[];
    }
    const data = await r.json();
    setTracks(data.tracks || []);
    setStudio(!!data.studio);
    setStatus("ready");
    return (data.tracks || []) as Track[];
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // ---- listen tracking ----
  const send = useCallback((beacon = false) => {
    const l = listen.current;
    if (!l || !l.playId) return;
    const json = JSON.stringify({ playId: l.playId, seconds: l.seconds, completed: l.completed });
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon("/api/room/play", new Blob([json], { type: "application/json" }));
    } else {
      fetch("/api/room/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: json, keepalive: true }).catch(() => {});
    }
  }, []);

  const begin = useCallback(async () => {
    const l = listen.current;
    if (!l || l.playId || l.creating) return;
    l.creating = true;
    try {
      const r = await fetch("/api/room/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: l.trackId, seconds: 0 }),
      });
      const data = await r.json();
      if (listen.current === l) l.playId = data.playId || null;
    } finally {
      l.creating = false;
    }
  }, []);

  const choose = (i: number) => {
    const a = audioRef.current;
    if (i === current && a) {
      // Tapping the current song toggles it; replaying after it ended starts a new listen.
      if (!a.paused) return a.pause();
      if (a.ended) listen.current = { trackId: tracks[i].id, playId: null, creating: false, seconds: 0, lastTime: 0, completed: false };
      a.play().catch(() => {});
      return;
    }
    send(true);
    retried.current = false;
    listen.current = { trackId: tracks[i].id, playId: null, creating: false, seconds: 0, lastTime: 0, completed: false };
    setCurrent(i);
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a || current === null || !tracks[current]) return;
    a.src = tracks[current].url;
    a.play().catch(() => {});
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlaying = () => {
      if (listen.current) listen.current.lastTime = a.currentTime;
      begin();
    };
    const onTime = () => {
      const l = listen.current;
      if (!l) return;
      const d = a.currentTime - l.lastTime;
      if (d > 0 && d < 1.5) l.seconds += d; // seeking ahead doesn't count as listening
      l.lastTime = a.currentTime;
    };
    const onPause = () => send();
    const onEnded = () => {
      if (listen.current) listen.current.completed = true;
      send();
      if (current !== null && current + 1 < tracks.length) {
        retried.current = false;
        listen.current = { trackId: tracks[current + 1].id, playId: null, creating: false, seconds: 0, lastTime: 0, completed: false };
        setCurrent(current + 1);
      }
    };
    const onError = async () => {
      // Private links expire after a few hours; fetch fresh ones once and resume.
      if (retried.current || current === null) return;
      retried.current = true;
      const fresh = await loadTracks();
      const same = fresh.find((x) => x.id === tracks[current]?.id);
      if (same) {
        const at = a.currentTime;
        a.src = same.url;
        a.currentTime = at;
        a.play().catch(() => {});
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") send(true);
    };
    a.addEventListener("playing", onPlaying);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    const tick = setInterval(() => {
      if (!a.paused) send();
    }, 15000);
    return () => {
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      clearInterval(tick);
    };
  }, [tracks, current, begin, send, loadTracks]);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setForm("sending");
    await fetch("/api/room/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, lang }),
    }).catch(() => {});
    setForm("sent");
  };

  const now = current !== null ? tracks[current] : null;

  return (
    <>
      <Head>
        <title>{t.title} · Davis Caruso</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, 'Times New Roman', serif", padding: "48px 16px 160px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.dim, marginBottom: 40 }}>
            <a href="/" style={{ color: C.dim, textDecoration: "none" }}>← {t.back}</a>
            <span>
              {(["en", "es"] as const).map((l, i) => (
                <span key={l}>
                  {i > 0 && " · "}
                  <button onClick={() => setLang(l)} style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer", color: lang === l ? C.gold : C.dim, textDecoration: lang === l ? "underline" : "none", textUnderlineOffset: 4 }}>
                    {l === "en" ? "English" : "Español"}
                  </button>
                </span>
              ))}
            </span>
          </div>

          <h1 style={{ fontWeight: 400, fontSize: 36, letterSpacing: "0.02em", margin: "0 0 8px", color: C.gold }}>{t.title}</h1>
          <p style={{ margin: "0 0 36px", color: C.dim, lineHeight: 1.6 }}>{t.sub}</p>

          {status === "loading" && <p style={{ color: C.dim }}>…</p>}

          {status === "signin" && (
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 24 }}>
              {expired && <p style={{ color: C.gold, marginTop: 0 }}>{t.expired}</p>}
              <p style={{ marginTop: 0, lineHeight: 1.6 }}>{t.signinIntro}</p>
              {form === "sent" ? (
                <p style={{ color: C.gold, marginBottom: 0, lineHeight: 1.6 }}>{t.sent}</p>
              ) : (
                <form onSubmit={requestLink} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} aria-label={t.email}
                    style={{ flex: "1 1 220px", padding: "12px 16px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.bg, color: C.text, font: "inherit", fontSize: 16 }} />
                  <button type="submit" disabled={form === "sending"}
                    style={{ padding: "12px 22px", borderRadius: 999, border: 0, background: C.gold, color: C.bg, font: "inherit", fontWeight: 700, cursor: "pointer" }}>
                    {form === "sending" ? t.sending : t.send}
                  </button>
                </form>
              )}
            </div>
          )}

          {status === "ready" && (
            <>
              <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: C.dim, margin: "0 0 12px" }}>{t.lossless}</p>
              {tracks.length === 0 && <p style={{ color: C.dim }}>{t.empty}</p>}
              <ol style={{ listStyle: "none", padding: 0, margin: 0, borderTop: `1px solid ${C.line}` }}>
                {tracks.map((tr, i) => {
                  const active = i === current;
                  return (
                    <li key={tr.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <button onClick={() => choose(i)}
                        style={{ width: "100%", display: "flex", gap: 16, alignItems: "baseline", textAlign: "left", background: active ? C.panel : "none", border: 0, padding: "16px 12px", font: "inherit", color: active ? C.gold : C.text, cursor: "pointer" }}>
                        <span style={{ width: 24, color: C.dim, fontVariantNumeric: "tabular-nums" }}>{active ? "♪" : i + 1}</span>
                        <span style={{ flex: 1 }}>
                          <span style={{ fontSize: 18 }}>{tr.title}</span>
                          {tr.note && <span style={{ display: "block", fontSize: 14, color: C.dim, marginTop: 4, lineHeight: 1.5 }}>{tr.note}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p style={{ marginTop: 32, fontSize: 13, color: C.dim }}>
                {studio && <><a href="/studio" style={{ color: C.gold }}>{t.studio}</a> · </>}
                <a href="/api/room/logout" style={{ color: C.dim }}>{t.signout}</a>
              </p>
            </>
          )}
        </div>

        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: C.panel, borderTop: `1px solid ${C.line}`, padding: "12px 16px", display: now ? "block" : "none" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{ fontSize: 12, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.nowPlaying}</div>
            <div style={{ color: C.gold, margin: "2px 0 8px" }}>{now?.title}</div>
            <audio ref={audioRef} controls preload="none" controlsList="nodownload" style={{ width: "100%" }} />
          </div>
        </div>
      </main>
    </>
  );
}