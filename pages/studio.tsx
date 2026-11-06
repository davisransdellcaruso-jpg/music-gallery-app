// /studio — Davis's private listening analytics for the room.
import Head from "next/head";
import { useEffect, useState } from "react";

const C = { bg: "#1c1410", panel: "#2a1f19", line: "#3d2e25", gold: "#c9a45c", text: "#efe6d8", dim: "#a8998a" };

type Stats = {
  totals: { supporters: number; activeListeners: number; plays: number; minutes: number };
  byTrack: { id: string; title: string; live: boolean; plays: number; listeners: number; completions: number; minutes: number }[];
  bySupporter: { email: string; name: string | null; plays: number; minutes: number; last: string }[];
  recent: { title: string; who: string; seconds: number; completed: boolean; at: string }[];
};

const cell: React.CSSProperties = { padding: "10px 8px", borderBottom: `1px solid ${C.line}`, textAlign: "left" };
const num: React.CSSProperties = { ...cell, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const head: React.CSSProperties = { ...cell, color: C.dim, fontWeight: 400, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" };
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Studio() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/room/stats").then(async (r) => {
      if (r.status === 401) return setError("Sign in at /room with your studio email first.");
      if (r.status === 403) return setError("This page is only for the studio account.");
      if (!r.ok) return setError("Couldn't load stats.");
      setStats(await r.json());
    });
  }, []);

  const max = Math.max(1, ...(stats?.byTrack.map((t) => t.plays) || [1]));

  return (
    <>
      <Head>
        <title>Studio · Listening Room</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif", padding: "48px 16px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <a href="/room" style={{ color: C.dim, fontSize: 13, textDecoration: "none" }}>← Listening room</a>
          <h1 style={{ fontWeight: 400, color: C.gold, fontSize: 32, margin: "24px 0 32px" }}>Studio</h1>

          {error && <p style={{ color: C.dim }}>{error}</p>}
          {!stats && !error && <p style={{ color: C.dim }}>…</p>}

          {stats && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 40 }}>
                {[
                  ["Supporters", stats.totals.supporters],
                  ["Have listened", stats.totals.activeListeners],
                  ["Plays", stats.totals.plays],
                  ["Minutes listened", stats.totals.minutes],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: 30, color: C.gold, marginTop: 6 }}>{value}</div>
                  </div>
                ))}
              </div>

              <h2 style={{ fontWeight: 400, fontSize: 20 }}>Songs, most played first</h2>
              <div style={{ overflowX: "auto", marginBottom: 40 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                  <thead>
                    <tr><th style={head}>Song</th><th style={{ ...head, textAlign: "right" }}>Plays</th><th style={{ ...head, textAlign: "right" }}>Listeners</th><th style={{ ...head, textAlign: "right" }}>Finished</th><th style={{ ...head, textAlign: "right" }}>Minutes</th></tr>
                  </thead>
                  <tbody>
                    {stats.byTrack.map((t) => (
                      <tr key={t.id}>
                        <td style={{ ...cell, minWidth: 180 }}>
                          {t.title}{!t.live && <span style={{ color: C.dim, fontSize: 12 }}> (hidden)</span>}
                          <div style={{ height: 4, background: C.line, borderRadius: 2, marginTop: 6 }}>
                            <div style={{ height: 4, width: `${(t.plays / max) * 100}%`, background: C.gold, borderRadius: 2 }} />
                          </div>
                        </td>
                        <td style={num}>{t.plays}</td>
                        <td style={num}>{t.listeners}</td>
                        <td style={num}>{t.plays ? `${Math.round((t.completions / t.plays) * 100)}%` : "—"}</td>
                        <td style={num}>{t.minutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 style={{ fontWeight: 400, fontSize: 20 }}>Most engaged supporters</h2>
              <div style={{ overflowX: "auto", marginBottom: 40 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                  <thead>
                    <tr><th style={head}>Supporter</th><th style={{ ...head, textAlign: "right" }}>Plays</th><th style={{ ...head, textAlign: "right" }}>Minutes</th><th style={{ ...head, textAlign: "right" }}>Last listen</th></tr>
                  </thead>
                  <tbody>
                    {stats.bySupporter.length === 0 && <tr><td style={{ ...cell, color: C.dim }} colSpan={4}>No listens yet.</td></tr>}
                    {stats.bySupporter.map((s) => (
                      <tr key={s.email}>
                        <td style={cell}>{s.name || s.email}{s.name && <div style={{ color: C.dim, fontSize: 12 }}>{s.email}</div>}</td>
                        <td style={num}>{s.plays}</td>
                        <td style={num}>{s.minutes}</td>
                        <td style={num}>{when(s.last)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 style={{ fontWeight: 400, fontSize: 20 }}>Recent listens</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                  <tbody>
                    {stats.recent.map((p, i) => (
                      <tr key={i}>
                        <td style={cell}>{p.who}</td>
                        <td style={cell}>{p.title}</td>
                        <td style={num}>{mmss(p.seconds)}{p.completed ? " ✓" : ""}</td>
                        <td style={num}>{when(p.at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ color: C.dim, fontSize: 13, marginTop: 24 }}>Your own listens and plays under 5 seconds are left out.</p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
