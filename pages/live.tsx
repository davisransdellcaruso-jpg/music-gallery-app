// pages/live.tsx
// Public livestream page. Controlled by the one-row Supabase table `live_stream`:
//   is_live = true + youtube_video_id  → shows the stream (and YouTube chat)
//   is_live = false + youtube_video_id → shows the last stream as a replay
//   is_live = false, no video          → "not live right now" + next stream date
// The page re-checks every 60 seconds, so open tabs switch over when you go live.
import Head from "next/head";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLang } from "../components/i18n";

type LiveRow = {
  is_live: boolean;
  youtube_video_id: string | null;
  title: string | null;
  title_es: string | null;
  next_stream_at: string | null;
  next_note: string | null;
  next_note_es: string | null;
};

const COPY = {
  en: {
    pageTitle: "Live | Davis Caruso",
    liveBadge: "Live now",
    defaultTitle: "Live with Davis Caruso",
    offlineTitle: "Not live right now",
    offlineBody: "Come back soon. The next session will show up right here.",
    nextLabel: "Next stream",
    replayLabel: "Latest stream",
    chat: "Live chat",
    back: "← Back to the gallery",
    loading: "Loading…",
  },
  es: {
    pageTitle: "En vivo | Davis Caruso",
    liveBadge: "En vivo ahora",
    defaultTitle: "En vivo con Davis Caruso",
    offlineTitle: "No estamos en vivo ahora",
    offlineBody: "Vuelve pronto. La próxima sesión aparecerá justo aquí.",
    nextLabel: "Próxima transmisión",
    replayLabel: "Última transmisión",
    chat: "Chat en vivo",
    back: "← Volver a la galería",
    loading: "Cargando…",
  },
} as const;

const PURPLE = "#715a99";
const PINK = "#e16d99";
const GOLD = "rgba(212,173,86,0.75)";
const CREAM = "#fbf5f0";

export default function LivePage() {
  const { lang } = useLang();
  const es = lang === "es";
  const c = COPY[es ? "es" : "en"];

  const [row, setRow] = useState<LiveRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [host, setHost] = useState("");
  const [wide, setWide] = useState(false);

  useEffect(() => {
    setHost(window.location.hostname);
    const mq = window.matchMedia("(min-width: 1000px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("live_stream")
        .select(
          "is_live, youtube_video_id, title, title_es, next_stream_at, next_note, next_note_es"
        )
        .eq("id", 1)
        .maybeSingle();
      if (!cancelled) {
        setRow((data as LiveRow) ?? null);
        setLoaded(true);
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const videoId = row?.youtube_video_id?.trim() || null;
  const isLive = !!row?.is_live && !!videoId;
  const title =
    (es && row?.title_es) || row?.title || (isLive ? c.defaultTitle : c.replayLabel);
  const note = (es && row?.next_note_es) || row?.next_note || null;

  const nextDate =
    row?.next_stream_at &&
    new Date(row.next_stream_at).getTime() > Date.now()
      ? new Intl.DateTimeFormat(es ? "es" : "en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Detroit",
          timeZoneName: "short",
        }).format(new Date(row.next_stream_at))
      : null;

  const showChat = isLive && !!host;

  return (
    <>
      <Head>
        <title>{c.pageTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          background: CREAM,
          color: PURPLE,
          fontFamily: "inherit",
          padding: "28px 16px 48px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <a
            href={`/gallery?lang=${lang}`}
            style={{ color: PURPLE, textDecoration: "none", fontSize: 16 }}
          >
            {c.back}
          </a>

          {!loaded ? (
            <p style={{ marginTop: 40, textAlign: "center" }}>{c.loading}</p>
          ) : videoId ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  margin: "22px 0 18px",
                  textAlign: "center",
                }}
              >
                {isLive && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: PINK,
                      color: "#fff",
                      fontSize: 14,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#fff",
                        animation: "livePulse 1.6s ease-in-out infinite",
                      }}
                    />
                    {c.liveBadge}
                  </span>
                )}
                <h1 style={{ margin: 0, fontWeight: 400, fontSize: "clamp(24px, 4vw, 36px)" }}>
                  {title}
                </h1>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: wide && showChat ? "row" : "column",
                  gap: 18,
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    flex: wide && showChat ? "1 1 auto" : undefined,
                    width: "100%",
                    aspectRatio: "16 / 9",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1px solid ${GOLD}`,
                    boxShadow: "0 8px 28px rgba(113,90,153,0.2)",
                    background: "#000",
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${encodeURIComponent(
                      videoId
                    )}?autoplay=1&mute=1&playsinline=1&rel=0`}
                    title={title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: 0, display: "block" }}
                  />
                </div>

                {showChat && (
                  <div
                    style={{
                      flex: wide ? "0 0 360px" : undefined,
                      height: wide ? "auto" : 480,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: `1px solid ${GOLD}`,
                      background: "#fff",
                    }}
                  >
                    <iframe
                      src={`https://www.youtube.com/live_chat?v=${encodeURIComponent(
                        videoId
                      )}&embed_domain=${encodeURIComponent(host)}`}
                      title={c.chat}
                      style={{ width: "100%", height: "100%", border: 0, display: "block" }}
                    />
                  </div>
                )}
              </div>

              {!isLive && nextDate && (
                <p style={{ textAlign: "center", marginTop: 22, fontSize: 17 }}>
                  {c.nextLabel}: <strong style={{ color: PINK, fontWeight: 600 }}>{nextDate}</strong>
                  {note ? ` · ${note}` : ""}
                </p>
              )}
            </>
          ) : (
            <section
              style={{
                maxWidth: 560,
                margin: "60px auto 0",
                padding: "34px 26px",
                textAlign: "center",
                borderRadius: 14,
                border: `1px solid ${GOLD}`,
                background: "rgba(255,255,255,0.6)",
                boxShadow: "0 8px 28px rgba(113,90,153,0.15)",
              }}
            >
              <div aria-hidden="true" style={{ color: PINK, fontSize: 16, marginBottom: 10 }}>
                ✦
              </div>
              <h1 style={{ margin: "0 0 12px", fontWeight: 400, fontSize: 30 }}>
                {c.offlineTitle}
              </h1>
              {nextDate ? (
                <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6 }}>
                  {c.nextLabel}:<br />
                  <strong style={{ color: PINK, fontWeight: 600 }}>{nextDate}</strong>
                  {note && (
                    <>
                      <br />
                      <span>{note}</span>
                    </>
                  )}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>{c.offlineBody}</p>
              )}
            </section>
          )}
        </div>

        <style>{`
          @keyframes livePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
        `}</style>
      </main>
    </>
  );
}