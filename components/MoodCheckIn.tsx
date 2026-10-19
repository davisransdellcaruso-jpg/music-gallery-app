// components/MoodCheckIn.tsx
// Shows an approved fan a small "how are you feeling today?" card when they
// arrive. Picking an emoji updates the emoji on their pin on the map.
// Recognises the fan from this device only (localStorage "dc_fan_pin").
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLang } from "./i18n";
import { MOODS } from "./moods";

const PIN_KEY = "dc_fan_pin";
const CHECKIN_KEY = "dc_mood_checkin"; // when they last picked a mood
const DISMISS_KEY = "dc_mood_dismissed"; // "not now" for this visit only
const COOLDOWN_MS = 6 * 60 * 60 * 1000;

const COPY = {
  en: {
    hi: (n: string) => `Hey ${n}!`,
    ask: "How are you feeling today?",
    later: "Not now",
    thanks: (m: string) => `Thanks! Your pin on the map now shows ${m}`,
    err: "Couldn't save that. Try again later.",
  },
  es: {
    hi: (n: string) => `¡Hola ${n}!`,
    ask: "¿Cómo te sientes hoy?",
    later: "Ahora no",
    thanks: (m: string) => `¡Gracias! Tu pin en el mapa ahora muestra ${m}`,
    err: "No se pudo guardar. Inténtalo más tarde.",
  },
} as const;

type StoredPin = { id?: string; display_name?: string; edit_token?: string };

export default function MoodCheckIn() {
  const { lang } = useLang();
  const c = COPY[lang === "es" ? "es" : "en"];

  const [pin, setPin] = useState<StoredPin | null>(null);
  const [state, setState] = useState<"hidden" | "ask" | "done" | "error">(
    "hidden"
  );
  const [picked, setPicked] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const raw = localStorage.getItem(PIN_KEY);
        if (!raw) return;
        const p: StoredPin = JSON.parse(raw);
        if (!p?.id || !p?.edit_token) return;

        if (sessionStorage.getItem(DISMISS_KEY)) return;
        const last = Number(localStorage.getItem(CHECKIN_KEY) || 0);
        if (last && Date.now() - last < COOLDOWN_MS) return;

        // Only approved fans (their pin is in the public list) get asked
        const { data } = await supabase.rpc("fan_pins_public");
        if (cancelled) return;
        const approved = Array.isArray(data) && data.some((x: any) => x.id === p.id);
        if (!approved) return;

        setPin(p);
        timer = setTimeout(() => !cancelled && setState("ask"), 2500);
      } catch {
        /* storage blocked or offline: just don't show */
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (state !== "ask") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state]);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setState("hidden");
  }

  async function choose(mood: string) {
    if (!pin?.id || !pin.edit_token) return;
    setPicked(mood);
    try {
      const res = await fetch("/api/fan-pins-mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pin.id, token: pin.edit_token, mood }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok || j.code === "rate") {
        try {
          localStorage.setItem(CHECKIN_KEY, String(Date.now()));
          const raw = localStorage.getItem(PIN_KEY);
          if (raw && res.ok) {
            localStorage.setItem(PIN_KEY, JSON.stringify({ ...JSON.parse(raw), mood }));
          }
        } catch {
          /* ignore */
        }
        if (res.ok) {
          setState("done");
          setTimeout(() => setState("hidden"), 3200);
        } else {
          setState("hidden");
        }
      } else {
        setState("error");
        setTimeout(() => setState("hidden"), 3200);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("hidden"), 3200);
    }
  }

  if (state === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-label={c.ask}
      style={{
        position: "fixed",
        left: "50%",
        bottom: 26,
        transform: "translateX(-50%)",
        zIndex: 2500,
        width: "min(440px, calc(100vw - 32px))",
        boxSizing: "border-box",
        padding: "18px 18px 14px",
        borderRadius: 18,
        textAlign: "center",
        border: "1px solid rgba(212,173,86,0.8)",
        background: "rgba(251,245,240,0.97)",
        color: "#715a99",
        boxShadow: "0 10px 34px rgba(113,90,153,0.3)",
        fontFamily: "inherit",
      }}
    >
      {state === "ask" && (
        <>
          <div style={{ fontSize: 20, fontStyle: "italic" }}>
            {c.hi(pin?.display_name || "")}
          </div>
          <div style={{ fontSize: 16, margin: "2px 0 12px" }}>{c.ask}</div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => choose(m)}
                aria-label={m}
                style={{
                  width: 46,
                  height: 46,
                  fontSize: 26,
                  lineHeight: 1,
                  borderRadius: 12,
                  cursor: "pointer",
                  border: "1px solid rgba(150,128,184,0.45)",
                  background: picked === m ? "#f3d7d3" : "#fff",
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={dismiss}
            style={{
              marginTop: 12,
              border: 0,
              background: "none",
              color: "#9680b8",
              fontSize: 13,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            {c.later}
          </button>
        </>
      )}
      {state === "done" && (
        <div style={{ fontSize: 16, padding: "6px 0" }}>{c.thanks(picked)}</div>
      )}
      {state === "error" && (
        <div style={{ fontSize: 15, padding: "6px 0", color: "#c85765" }}>
          {c.err}
        </div>
      )}
    </div>
  );
}