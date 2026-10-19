"use client";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import FanPinForm from "./FanPinForm";
import { useLang, type Lang } from "./i18n";
import type { Cluster, FanPin, Focus } from "./MapView";

// Leaflet touches `window`, so the map itself is client-only.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <LoadingText />,
});

function LoadingText() {
  return (
    <div style={{ color: "white", textAlign: "center" }}>
      Loading… / Cargando…
    </div>
  );
}

const STORAGE_KEY = "dc_fan_pin";

const overlayBtn: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "2px solid #3b0a8c",
  background: "#f3eee6",
  color: "#3b0a8c",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "left",
};

const card: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "2px solid #3b0a8c",
  boxShadow: "4px 4px 0 #3b0a8c",
  background: "#f3eee6",
  color: "#3b0a8c",
  pointerEvents: "auto",
};

const primaryBtn: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  color: "#f3eee6",
  background: "#3b0a8c",
};

const ghostBtn: CSSProperties = {
  ...primaryBtn,
  color: "#3b0a8c",
  background: "transparent",
  border: "2px solid #3b0a8c",
};

const roundBtn: CSSProperties = {
  width: 44,
  height: 44,
  padding: 0,
  borderRadius: "50%",
  border: "2px solid #3b0a8c",
  background: "#f3eee6",
  color: "#3b0a8c",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "2px 2px 0 #3b0a8c",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const bigBtn: CSSProperties = {
  ...primaryBtn,
  padding: "12px 22px",
  fontSize: 17.5,
};

const skipBtn: CSSProperties = {
  padding: "5px 10px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "#5a2bd0",
  textDecoration: "underline",
  fontSize: 12,
  cursor: "pointer",
};

// Little swatches that match the dots on the map
const swatchBase: CSSProperties = {
  display: "inline-block",
  borderRadius: "50%",
  boxSizing: "border-box",
};
const faintSwatch: CSSProperties = {
  ...swatchBase,
  width: 14,
  height: 14,
  background: "rgba(232,38,27,0.78)",
  border: "2px solid #f3eee6",
};
const fanSwatch: CSSProperties = {
  ...swatchBase,
  width: 12,
  height: 12,
  background: "#f3eee6",
  border: "3px solid #3b0a8c",
};
const mineSwatch: CSSProperties = {
  ...fanSwatch,
  background: "#ffb59a",
  border: "3px solid #e8261b",
};
const pendingSwatch: CSSProperties = {
  ...swatchBase,
  width: 12,
  height: 12,
  background: "transparent",
  border: "3px dashed #3b0a8c",
};

function LegendRow({ swatch, text }: { swatch: ReactNode; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 12,
        lineHeight: 1.35,
        marginTop: 4,
      }}
    >
      <span
        style={{
          width: 18,
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {swatch}
      </span>
      <span>{text}</span>
    </div>
  );
}

type Props = {
  /** Signup flow: shows a welcome banner with "Add myself" / "Skip" */
  flow?: boolean;
  /** Where "Skip" and "Continue" lead in flow mode */
  nextHref?: string;
};

export default function ListenerMap({ flow = false, nextHref = "/story" }: Props) {
  const router = useRouter();
  const { lang, setLang, t } = useLang();

  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [pins, setPins] = useState<FanPin[]>([]);
  const [loading, setLoading] = useState(true);

  const [mine, setMine] = useState<FanPin | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [focus, setFocus] = useState<Focus>(null);

  // Phone layout state
  const [isMobile, setIsMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [touchY, setTouchY] = useState<number | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const goNext = () => router.push(nextHref);

  // 🔹 Load public data (anonymous clusters + approved fan pins)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [c, p] = await Promise.all([
        supabase.rpc("listener_clusters"),
        supabase.rpc("fan_pins_public"),
      ]);
      if (cancelled) return;
      if (!c.error && c.data) setClusters(c.data as Cluster[]);
      if (!p.error && p.data) setPins(p.data as FanPin[]);
      setLoading(false);
    }
    load();
    const timer = setInterval(load, 60_000); // refresh once a minute
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // 🔹 Remember this visitor's own pin (on this device only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMine(JSON.parse(raw));
    } catch {
      /* storage unavailable: fine */
    }
  }, []);

  const approvedMine = !!mine && pins.some((p) => p.id === mine.id);
  const mineId = approvedMine && mine ? mine.id : null;
  const pendingPin = mine && !approvedMine ? mine : null;

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return pins
      .filter(
        (p) =>
          p.display_name.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          (p.country ?? "").toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [search, pins]);

  const flyToPin = (p: FanPin) =>
    setFocus({
      lat: p.latitude,
      lng: p.longitude,
      key: Date.now(),
      pinId: p.id,
    });

  function handleSubmitted(pin: FanPin) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pin));
    } catch {
      /* ignore */
    }
    setMine(pin);
    setSheetOpen(true);
    flyToPin(pin);
  }

  if (loading) return <LoadingText />;

  return (
    <div
      style={{
        height: isMobile ? "100dvh" : "100vh",
        width: "100%",
        background:
          "#f3eee6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ✨ Animated starfield backdrop */}
      <motion.div
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(1px 1px at 20px 20px, rgba(255,255,255,0.2) 50%, transparent 50%)",
          backgroundSize: "100px 100px",
          opacity: 0.4,
          zIndex: 0,
        }}
      />

      {!isMobile && (
      <h1
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#3b0a8c",
          background: "#f3eee6",
          border: "2px solid #3b0a8c",
          boxShadow: "3px 3px 0 #3b0a8c",
          borderRadius: 12,
          padding: "2px 18px",
          fontFamily: "Trocchi, serif",
          fontWeight: "bold",
          fontSize: "clamp(1.5rem, 4vw, 2.4rem)",
          letterSpacing: "0.5px",
          zIndex: 1000,
          whiteSpace: "nowrap",
        }}
      >
        {t.title}
      </h1>
      )}

      <MapView
        clusters={clusters}
        pins={pins}
        mineId={mineId}
        pendingPin={pendingPin}
        focus={focus}
        t={t}
      />

      {/* Controls: language, search, add yourself, find my pin */}
      {!isMobile && (
      <div
        style={{
          position: "absolute",
          top: "calc(5vh + 14px)",
          right: "calc(5vw + 14px)",
          zIndex: 1000,
          width: "min(260px, 55vw)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          {(["en", "es"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              style={{
                ...overlayBtn,
                padding: "5px 10px",
                fontSize: 12,
                background:
                  lang === l
                    ? "#3b0a8c"
                    : "#f3eee6",
                color: lang === l ? "#f3eee6" : "#3b0a8c",
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            style={{
              ...overlayBtn,
              width: "100%",
              boxSizing: "border-box",
              fontWeight: 400,
              cursor: "text",
              outline: "none",
            }}
          />
          {matches.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "100%",
                marginTop: 4,
                background: "#f3eee6",
                border: "2px solid #3b0a8c",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {matches.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    flyToPin(p);
                    setSearch("");
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
                  <b>{p.display_name}</b>
                  <span style={{ opacity: 0.7 }}> · {p.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowForm(true)} style={overlayBtn}>
          {t.addYourself}
        </button>

        {mine && (
          <button onClick={() => flyToPin(mine)} style={overlayBtn}>
            {t.findMyPin}
          </button>
        )}
      </div>
      )}

      {!isMobile && (
      <div>{/* Bottom row: map key (always) + welcome banner (signup flow only).
          Sits just above the OpenStreetMap attribution strip. */}
      <div
        style={{
          position: "absolute",
          left: "calc(5vw + 14px)",
          right: "calc(5vw + 14px)",
          bottom: "calc(5vh + 34px)",
          zIndex: 1000,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        {/* Map key: small, quiet, no counts */}
        <div
          style={{
            flex: "1 1 170px",
            maxWidth: 260,
            pointerEvents: "auto",
            padding: "6px 10px",
            borderRadius: 10,
            background: "rgba(243,238,230,0.92)",
            border: "2px solid #3b0a8c",
            color: "#3b0a8c",
            fontSize: 12,
          }}
        >
          <LegendRow swatch={<span style={faintSwatch} />} text={t.legendListeners} />
          <LegendRow swatch={<span style={fanSwatch} />} text={t.legendFans} />
          {mine && (
            <LegendRow
              swatch={<span style={approvedMine ? mineSwatch : pendingSwatch} />}
              text={approvedMine ? t.legendMe : t.legendPending}
            />
          )}
        </div>

        {flow && (
          <div
            style={{
              ...card,
              flex: "0 1 525px",
              padding: "15px 18px",
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 20 }}>
              {mine ? t.flowDoneTitle : t.flowTitle}
            </div>
            <div
              style={{
                fontSize: 17,
                lineHeight: 1.45,
                margin: "8px 0 15px",
                color: "#5a2bd0",
              }}
            >
              {mine ? t.flowDoneBody : t.flowBody}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {mine ? (
                <button onClick={goNext} style={bigBtn}>
                  {t.flowContinue}
                </button>
              ) : (
                <>
                  <button onClick={() => setShowForm(true)} style={bigBtn}>
                    {t.flowAdd}
                  </button>
                  <button onClick={goNext} style={skipBtn}>
                    {t.flowSkip}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Invisible spacer so the welcome card stays centered */}
        <div style={{ flex: "1 1 170px", maxWidth: 260, visibility: "hidden" }} />
      </div>
      </div>
      )}


      {/* ───────── Phone layout: calm, full-bleed map ───────── */}
      {isMobile && (
        <>
          {searchOpen ? (
            <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 1000 }}>
              <div style={{ position: "relative" }}>
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  style={{
                    ...overlayBtn,
                    width: "100%",
                    boxSizing: "border-box",
                    fontSize: 16,
                    fontWeight: 400,
                    cursor: "text",
                    outline: "none",
                    padding: "13px 46px 13px 14px",
                    boxShadow: "3px 3px 0 #3b0a8c",
                  }}
                />
                <button
                  aria-label="Close search"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearch("");
                  }}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 6,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    color: "#3b0a8c",
                    fontSize: 18,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              {matches.length > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    background: "#f3eee6",
                    border: "2px solid #3b0a8c",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {matches.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        flyToPin(p);
                        setSearch("");
                        setSearchOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "13px 14px",
                        background: "transparent",
                        border: "none",
                        color: "#3b0a8c",
                        fontSize: 16,
                        cursor: "pointer",
                      }}
                    >
                      <b>{p.display_name}</b>
                      <span style={{ opacity: 0.7 }}> · {p.city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <h1
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  right: 68,
                  margin: 0,
                  textAlign: "center",
                  color: "#3b0a8c",
                  background: "#f3eee6",
                  border: "2px solid #3b0a8c",
                  boxShadow: "3px 3px 0 #3b0a8c",
                  borderRadius: 12,
                  padding: "9px 10px",
                  fontFamily: "Trocchi, serif",
                  fontWeight: "bold",
                  fontSize: "1.05rem",
                  zIndex: 1000,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.title}
              </h1>

              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <button
                  onClick={() => setLang(lang === "en" ? "es" : "en")}
                  aria-label="Language"
                  style={roundBtn}
                >
                  {lang === "en" ? "ES" : "EN"}
                </button>
                <button
                  onClick={() => {
                    setSearchOpen(true);
                    setKeyOpen(false);
                  }}
                  aria-label={t.searchPlaceholder}
                  style={roundBtn}
                >
                  🔍
                </button>
                <button
                  onClick={() => setKeyOpen((k) => !k)}
                  aria-label="Map key"
                  aria-expanded={keyOpen}
                  style={{ ...roundBtn, fontFamily: "Georgia, serif", fontStyle: "italic" }}
                >
                  i
                </button>
              </div>

              {keyOpen && (
                <div
                  onClick={() => setKeyOpen(false)}
                  style={{
                    position: "absolute",
                    top: 120,
                    right: 12,
                    zIndex: 1000,
                    padding: "8px 12px",
                    borderRadius: 12,
                    background: "#f3eee6",
                    border: "2px solid #3b0a8c",
                    boxShadow: "3px 3px 0 #3b0a8c",
                    color: "#3b0a8c",
                    fontSize: 14,
                  }}
                >
                  <LegendRow swatch={<span style={faintSwatch} />} text={t.legendListeners} />
                  <LegendRow swatch={<span style={fanSwatch} />} text={t.legendFans} />
                  {mine && (
                    <LegendRow
                      swatch={<span style={approvedMine ? mineSwatch : pendingSwatch} />}
                      text={approvedMine ? t.legendMe : t.legendPending}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {/* Bottom: welcome sheet (signup flow) or a simple button row */}
          {!searchOpen && (
            <div
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                bottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)",
                zIndex: 1000,
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              {flow && sheetOpen ? (
                <div
                  style={{
                    ...card,
                    width: "100%",
                    maxWidth: 420,
                    padding: "6px 16px 16px",
                    textAlign: "center",
                  }}
                >
                  <button
                    aria-label="Hide"
                    onClick={() => setSheetOpen(false)}
                    onTouchStart={(e) => setTouchY(e.touches[0].clientY)}
                    onTouchEnd={(e) => {
                      if (touchY !== null && e.changedTouches[0].clientY - touchY > 30) {
                        setSheetOpen(false);
                      }
                      setTouchY(null);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 0 8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: 44,
                        height: 4,
                        margin: "0 auto",
                        borderRadius: 2,
                        background: "#3b0a8c",
                        opacity: 0.35,
                      }}
                    />
                  </button>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {mine ? t.flowDoneTitle : t.flowTitle}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      lineHeight: 1.4,
                      margin: "6px 0 14px",
                      color: "#5a2bd0",
                    }}
                  >
                    {mine ? t.flowDoneBody : t.flowBody}
                  </div>
                  {mine ? (
                    <button onClick={goNext} style={{ ...bigBtn, width: "100%" }}>
                      {t.flowContinue}
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setShowForm(true)} style={{ ...bigBtn, width: "100%" }}>
                        {t.flowAdd}
                      </button>
                      <button onClick={goNext} style={{ ...skipBtn, fontSize: 14, marginTop: 8 }}>
                        {t.flowSkip}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    pointerEvents: "auto",
                  }}
                >
                  {flow ? (
                    <>
                      <button
                        aria-label="Show"
                        onClick={() => setSheetOpen(true)}
                        style={{ ...roundBtn, width: 44, height: 44 }}
                      >
                        ▴
                      </button>
                      {mine ? (
                        <button onClick={goNext} style={{ ...bigBtn, boxShadow: "3px 3px 0 #3b0a8c" }}>
                          {t.flowContinue}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowForm(true)}
                            style={{ ...bigBtn, boxShadow: "3px 3px 0 #3b0a8c" }}
                          >
                            {t.flowAdd}
                          </button>
                          <button
                            onClick={goNext}
                            style={{ ...skipBtn, background: "#f3eee6", borderRadius: 10, padding: "8px 10px" }}
                          >
                            {t.flowSkip}
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowForm(true)}
                        style={{ ...bigBtn, boxShadow: "3px 3px 0 #3b0a8c" }}
                      >
                        {t.addYourself}
                      </button>
                      {mine && (
                        <button
                          onClick={() => flyToPin(mine)}
                          style={{ ...ghostBtn, padding: "12px 16px", fontSize: 15, background: "#f3eee6" }}
                        >
                          {t.findMyPin}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showForm && (
        <FanPinForm
          lang={lang}
          t={t}
          onClose={() => setShowForm(false)}
          onSubmitted={handleSubmitted}
          onContinue={flow ? goNext : undefined}
        />
      )}
    </div>
  );
}