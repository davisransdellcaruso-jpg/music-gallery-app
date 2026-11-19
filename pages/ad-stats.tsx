// Private ad stats: daviscaruso.com/ad-stats?key=YOUR_STATS_KEY
// (same key as /signup-stats and /playlist-stats).
// Pick a month (&month=2026-11) and a platform (&p=reddit or &p=meta), then a
// song button to see that song's ad sets: how many people landed on each ad
// page (/s/<slug>), how many tapped through to Spotify / Apple Music / YouTube,
// and how many gave an email. Impressions and cost per click live in
// Reddit / Meta Ads Manager.
//
// Ads are sorted by ad_landings.platform / ad_landings.song (see
// supabase/ad_landings_platform_song.sql). Rows without those set are sorted
// by slug: "...reddit..." → Reddit, "meta..." → Meta, "...smitten..." → Smitten.
import { useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const TZ = "America/Detroit";

const PLATFORMS = [
  { id: "reddit", name: "Reddit", manager: "Reddit Ads Manager" },
  { id: "meta", name: "Meta", manager: "Meta Ads Manager" },
] as const;
type PlatformId = (typeof PLATFORMS)[number]["id"];

function guessPlatform(slug: string): string {
  if (slug.includes("reddit")) return "reddit";
  if (slug.startsWith("meta") || slug.includes("-meta") || slug.includes("instagram") || slug.includes("facebook"))
    return "meta";
  return "other";
}

function guessSong(slug: string): string {
  if (slug.includes("smitten")) return "Smitten";
  if (slug.includes("pom")) return "Peace Of Mind";
  return "Other";
}

// ---- Months, in Ann Arbor time ---------------------------------------------

// Midnight on the 1st of a month in Detroit, as a real instant.
// month is 1-12 and may overflow (13 = January of the next year).
function monthStart(year: number, month: number): Date {
  const guess = new Date(Date.UTC(year, month - 1, 1, 5)); // midnight if on EST
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(guess)
  );
  return new Date(guess.getTime() - hour * 3600e3); // on EDT that read 1:00, so step back
}

function monthKeyOf(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

function parseMonthKey(key: string): [number, number] {
  const [y, m] = key.split("-").map(Number);
  return [y, m];
}

function monthLabel(key: string, long = false): string {
  const [y, m] = parseMonthKey(key);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleString("en-US", {
    timeZone: "UTC",
    month: long ? "long" : "short",
    year: "numeric",
  });
}

// ---- Data -------------------------------------------------------------------

type AdRow = {
  slug: string;
  platform: string;
  song: string;
  live: boolean;
  visitors: number;
  spotify: number;
  apple: number;
  youtube: number;
  taps: number;
  emails: number;
  confirmed: number;
  resetAt: string | null;
  resetInMonth: boolean;
};

type Props = {
  statsKey: string;
  month: string;
  months: string[];
  platform: PlatformId;
  platformCounts: Record<string, number>;
  ads: AdRow[]; // every ad this month, all platforms
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const expected = process.env.STATS_KEY;
  if (!expected || query.key !== expected) return { notFound: true };

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex");

  // select("*") so the page still works before the newer columns exist
  const { data: landings } = await supabaseAdmin
    .from("ad_landings")
    .select("*")
    .order("created_at", { ascending: false });

  // Months to offer: from the first ad activity (oldest ad page or oldest
  // streaming tap, whichever is earlier) up to this month.
  const nowKey = monthKeyOf(new Date());
  let firstKey = nowKey;
  for (const l of landings ?? []) {
    if (l.created_at) {
      const k = monthKeyOf(new Date(l.created_at));
      if (k < firstKey) firstKey = k;
    }
  }
  const { data: firstTap } = await supabaseAdmin
    .from("ad_taps")
    .select("tapped_at")
    .order("tapped_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstTap?.tapped_at) {
    const k = monthKeyOf(new Date(firstTap.tapped_at));
    if (k < firstKey) firstKey = k;
  }
  const months: string[] = [];
  {
    let [y, m] = parseMonthKey(firstKey);
    for (let guard = 0; guard < 60; guard++) {
      const k = `${y}-${String(m).padStart(2, "0")}`;
      months.push(k);
      if (k >= nowKey) break;
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  }

  const asked = String(query.month ?? "");
  const month = months.includes(asked) ? asked : nowKey;
  const [y, m] = parseMonthKey(month);
  const start = monthStart(y, m);
  const end = monthStart(y, m + 1);

  const askedPlatform = String(query.p ?? "").toLowerCase();
  const platform: PlatformId = PLATFORMS.some((p) => p.id === askedPlatform)
    ? (askedPlatform as PlatformId)
    : "reddit";

  const ads: AdRow[] = [];
  for (const landing of landings ?? []) {
    const slug = landing.slug as string;
    // Skip ad pages that didn't exist yet in the chosen month
    if (landing.created_at && new Date(landing.created_at) >= end) continue;

    const page = `/s/${slug}`;
    // Count from the later of: the start of the month, or this ad's last
    // stats reset. Older rows stay in Supabase, they just aren't counted.
    const resetAt = (landing.stats_reset_at as string | null) ?? null;
    const resetTime = resetAt ? new Date(resetAt).getTime() : 0;
    const since = new Date(Math.max(start.getTime(), resetTime)).toISOString();
    const until = end.toISOString();

    let visitors = 0;
    let emails = 0;
    let confirmed = 0;
    let tapRows: { platform: string }[] = [];

    if (resetTime < end.getTime()) {
      // Landed on the page = the signup card on it was shown (bots are already
      // filtered out). Counted once per person, so reloads don't inflate it.
      const { data: events } = await supabaseAdmin
        .from("signup_events")
        .select("event, visitor_id, source, page")
        .gte("created_at", since)
        .lt("created_at", until)
        .or(`page.eq.${page},source.eq.${slug}`)
        .limit(50000);

      const people = new Set<string>();
      let anonymousViews = 0;
      for (const e of events ?? []) {
        if (e.event === "shown" && e.page === page) {
          if (e.visitor_id) people.add(e.visitor_id);
          else anonymousViews += 1;
        }
        if (e.event === "submitted" && e.page === page) emails += 1;
        if (e.event === "confirmed" && e.source === slug) confirmed += 1;
      }
      visitors = people.size + anonymousViews;

      const { data: taps } = await supabaseAdmin
        .from("ad_taps")
        .select("platform")
        .eq("ad_slug", slug)
        .gte("tapped_at", since)
        .lt("tapped_at", until)
        .limit(50000);
      tapRows = taps ?? [];
    }

    const count = (p: string) => tapRows.filter((t) => t.platform === p).length;
    ads.push({
      slug,
      platform: String(landing.platform || guessPlatform(slug)).toLowerCase(),
      song: String(landing.song || guessSong(slug)),
      live: landing.active !== false,
      visitors,
      spotify: count("spotify"),
      apple: count("apple"),
      youtube: count("youtube"),
      taps: tapRows.length,
      emails,
      confirmed,
      resetAt,
      resetInMonth: resetTime >= start.getTime() && resetTime < end.getTime(),
    });
  }

  const platformCounts: Record<string, number> = {};
  for (const a of ads) platformCounts[a.platform] = (platformCounts[a.platform] ?? 0) + 1;

  return { props: { statsKey: String(query.key), month, months, platform, platformCounts, ads } };
};

// ---- Display ----------------------------------------------------------------

function pct(n: number, d: number) {
  if (!d) return "–";
  return `${Math.round((n / d) * 100)}%`;
}

function verdict(a: { visitors: number; taps: number }): string {
  if (a.visitors === 0) return "No one has landed on this page yet this month.";
  if (a.taps === 0)
    return "People are landing here but nobody has tapped a streaming button yet. Check the clip and buttons on a phone, and compare with the click count in Ads Manager.";
  return `${pct(a.taps, a.visitors)} of visitors tapped through to listen.`;
}

function formatReset(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Tile({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value.toLocaleString("en-US")}</span>
      {sub && <span className="tile-sub">{sub}</span>}
    </div>
  );
}

// Horizontal bars, one color: the length is the number, the label says what it is
function Bars({ rows, unit }: { rows: { label: string; value: number; text: string; note?: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div key={r.label} className="hbar" title={`${r.label}: ${r.text}${r.note ? ` (${r.note})` : ""}`}>
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="hbar-value">
            {r.text}
            {r.note && <small> {r.note}</small>}
          </span>
        </div>
      ))}
      <span className="sr">{unit}</span>
    </div>
  );
}

function AdCard({ a }: { a: AdRow }) {
  const max = Math.max(1, a.visitors, a.taps, a.emails);
  const steps = [
    { label: "Landed on the page", hint: `People who opened daviscaruso.com/s/${a.slug}`, n: a.visitors, rate: "" },
    {
      label: "Tapped to listen",
      hint: `Spotify ${a.spotify} · Apple Music ${a.apple} · YouTube ${a.youtube}`,
      n: a.taps,
      rate: a.visitors ? `${pct(a.taps, a.visitors)} click-through` : "",
    },
    {
      label: "Gave their email",
      hint: `For the unreleased song · ${a.confirmed} confirmed`,
      n: a.emails,
      rate: a.visitors ? `${pct(a.emails, a.visitors)} of visitors` : "",
    },
  ];
  return (
    <section className="ad">
      <h3>
        {a.slug}
        {!a.live && <span className="off">switched off</span>}
      </h3>
      {a.resetAt && a.resetInMonth && <p className="hint reset">Counting since {formatReset(a.resetAt)} (stats reset)</p>}
      <p className="verdict">{verdict(a)}</p>
      <div className="funnel">
        {steps.map((step, i) => (
          <div key={step.label} className="step">
            <div className="step-top">
              <span className="num">{i + 1}</span>
              <span className="label">{step.label}</span>
              <span className="count">{step.n}</span>
            </div>
            <div className="bar">
              <span style={{ width: `${Math.min(100, (step.n / max) * 100)}%` }} />
            </div>
            <p className="hint">
              {step.hint}
              {step.rate && <strong> · {step.rate}</strong>}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlatformView({ name, manager, ads, monthName }: { name: string; manager: string; ads: AdRow[]; monthName: string }) {
  // Songs in order of their newest ad (ads arrive newest first)
  const songs = Array.from(new Set(ads.map((a) => a.song)));
  const [song, setSong] = useState<string>(songs[0] ?? "");
  const shown = ads.filter((a) => a.song === song);
  const total = (k: "visitors" | "taps" | "emails" | "confirmed" | "spotify" | "apple" | "youtube") =>
    shown.reduce((t, a) => t + a[k], 0);

  if (songs.length === 0) {
    return <p className="verdict">No {name} ads in {monthName}.</p>;
  }

  const landed = total("visitors");
  const taps = total("taps");
  const emails = total("emails");

  return (
    <>
      <div className="songs" role="tablist" aria-label="Song">
        {songs.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === song}
            className={s === song ? "on" : ""}
            onClick={() => setSong(s)}
          >
            {s}
            <span className="n">
              {ads.filter((a) => a.song === s).length} ad set{ads.filter((a) => a.song === s).length === 1 ? "" : "s"}
            </span>
          </button>
        ))}
      </div>

      <section className="panel">
        <h2>
          {song} <span className="muted">on {name} · {monthName}</span>
        </h2>
        <div className="tiles">
          <Tile label="Landed on the page" value={landed} sub={shown.length > 1 ? `across ${shown.length} ad sets` : undefined} />
          <Tile label="Tapped to listen" value={taps} sub={landed ? `${pct(taps, landed)} click-through` : undefined} />
          <Tile
            label="Gave their email"
            value={emails}
            sub={landed ? `${pct(emails, landed)} of visitors · ${total("confirmed")} confirmed` : undefined}
          />
        </div>

        <div className="charts">
          <div className="chart">
            <h4>Where they went to listen</h4>
            {taps === 0 ? (
              <p className="hint">No streaming taps yet.</p>
            ) : (
              <Bars
                unit="streaming taps"
                rows={[
                  { label: "Spotify", value: total("spotify"), text: String(total("spotify")), note: pct(total("spotify"), taps) },
                  { label: "Apple Music", value: total("apple"), text: String(total("apple")), note: pct(total("apple"), taps) },
                  { label: "YouTube", value: total("youtube"), text: String(total("youtube")), note: pct(total("youtube"), taps) },
                ]}
              />
            )}
          </div>

          {shown.length > 1 && (
            <div className="chart">
              <h4>Click-through by ad set</h4>
              <Bars
                unit="percent of visitors who tapped to listen"
                rows={[...shown]
                  .sort((a, b) => (b.visitors ? b.taps / b.visitors : 0) - (a.visitors ? a.taps / a.visitors : 0))
                  .map((a) => ({
                    label: a.slug,
                    value: a.visitors ? a.taps / a.visitors : 0,
                    text: pct(a.taps, a.visitors),
                    note: `${a.taps} of ${a.visitors}`,
                  }))}
              />
            </div>
          )}
        </div>
      </section>

      <h2 className="sets-title">Ad sets</h2>
      {shown.map((a) => (
        <AdCard key={a.slug} a={a} />
      ))}

      <p className="hint manager">
        Impressions and cost per click are in {manager}. Compare its click count with &ldquo;Landed on the page&rdquo;
        to see how many leave before the page loads.
      </p>
    </>
  );
}

export default function AdStats({ statsKey, month, months, platform, platformCounts, ads }: Props) {
  const href = (next: { month?: string; p?: string }) =>
    `?key=${encodeURIComponent(statsKey)}&month=${next.month ?? month}&p=${next.p ?? platform}`;
  const current = PLATFORMS.find((p) => p.id === platform) ?? PLATFORMS[0];
  const others = ads.filter((a) => !PLATFORMS.some((p) => p.id === a.platform));
  const monthName = monthLabel(month, true);

  return (
    <>
      <Head>
        <title>Ad Stats</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="adstats">
        <header>
          <h1>Ad pages</h1>
          <nav className="months" aria-label="Month">
            {months.map((k) => (
              <a key={k} href={href({ month: k })} className={k === month ? "on" : ""}>
                {monthLabel(k)}
              </a>
            ))}
          </nav>
        </header>

        <nav className="toggle" aria-label="Platform">
          {PLATFORMS.map((p) => (
            <a key={p.id} href={href({ p: p.id })} className={p.id === platform ? "on" : ""}>
              {p.name}
              <span className="n">{platformCounts[p.id] ?? 0}</span>
            </a>
          ))}
        </nav>

        <PlatformView
          key={`${platform}-${month}`}
          name={current.name}
          manager={current.manager}
          monthName={monthName}
          ads={ads.filter((a) => a.platform === platform)}
        />

        {others.length > 0 && (
          <section className="other">
            <h2>Other ad pages</h2>
            <p className="hint">Set platform to reddit or meta on these rows in ad_landings to sort them.</p>
            {others.map((a) => (
              <AdCard key={a.slug} a={a} />
            ))}
          </section>
        )}

        <footer className="extra">
          <a href={`/signup-stats?key=${encodeURIComponent(statsKey)}`}>Email signups →</a>
          <a href={`/playlist-stats?key=${encodeURIComponent(statsKey)}`}>Playlist taps →</a>
        </footer>
      </main>

      {/* Global (scoped under .adstats) so the styles reach every part of the page */}
      <style jsx global>{`
        html,
        body {
          background: #f7efe9 !important;
          color: #3d2f55 !important;
        }
        .adstats {
          max-width: 860px;
          margin: 0 auto;
          padding: 40px 16px 64px;
          font-family: Georgia, serif;
          color: #3d2f55;
        }
        .adstats header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 22px;
        }
        .adstats h1 {
          margin: 0;
          font-size: 2rem;
          color: #715a99;
        }
        .adstats .months {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .adstats .months a {
          padding: 6px 14px;
          border: 1px solid #cbbde0;
          border-radius: 999px;
          color: #715a99;
          font-size: 0.9rem;
          text-decoration: none;
          background: #fff;
        }
        .adstats .months a.on {
          background: #715a99;
          border-color: #715a99;
          color: #fff;
        }

        /* Reddit | Meta */
        .adstats .toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 4px;
          margin-bottom: 22px;
          background: #efe8f6;
          border-radius: 12px;
        }
        .adstats .toggle a {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 9px;
          color: #715a99;
          font-size: 1.15rem;
          text-decoration: none;
        }
        .adstats .toggle a.on {
          background: #fff;
          color: #3d2f55;
          font-weight: bold;
          box-shadow: 0 1px 4px rgba(61, 47, 85, 0.12);
        }
        .adstats .n {
          font-size: 0.72rem;
          font-weight: normal;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(113, 90, 153, 0.12);
          color: #715a99;
        }

        /* Song buttons */
        .adstats .songs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }
        .adstats .songs button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 9px 18px;
          border: 1px solid #cbbde0;
          border-radius: 999px;
          background: #fff;
          color: #715a99;
          font-family: Georgia, serif;
          font-size: 1rem;
          cursor: pointer;
        }
        .adstats .songs button.on {
          background: #715a99;
          border-color: #715a99;
          color: #fff;
        }
        .adstats .songs button.on .n {
          background: rgba(255, 255, 255, 0.22);
          color: #fff;
        }

        /* Song summary */
        .adstats .panel {
          padding: 22px;
          margin-bottom: 30px;
          background: #fff;
          border: 1px solid #e6dcef;
          border-radius: 12px;
        }
        .adstats h2 {
          margin: 0 0 16px;
          font-size: 1.35rem;
          color: #715a99;
        }
        .adstats .muted {
          font-size: 0.95rem;
          font-weight: normal;
          color: #6f6283;
        }
        .adstats .tiles {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }
        @media (max-width: 620px) {
          .adstats .tiles {
            grid-template-columns: 1fr;
          }
        }
        .adstats .tile {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
          background: #f8f4fb;
          border-radius: 10px;
        }
        .adstats .tile-label {
          font-size: 0.85rem;
          color: #6f6283;
        }
        .adstats .tile-value {
          font-size: 2.4rem;
          line-height: 1.1;
          font-weight: bold;
          color: #3d2f55;
        }
        .adstats .tile-sub {
          font-size: 0.85rem;
          color: #715a99;
        }
        .adstats .charts {
          display: grid;
          gap: 22px;
        }
        .adstats h4 {
          margin: 0 0 10px;
          font-size: 0.95rem;
          font-weight: normal;
          color: #6f6283;
        }
        .adstats .hbars {
          display: grid;
          gap: 8px;
        }
        .adstats .hbar {
          display: grid;
          grid-template-columns: minmax(90px, 140px) 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 2px 4px;
          border-radius: 6px;
        }
        .adstats .hbar:hover {
          background: #f8f4fb;
        }
        .adstats .hbar-label {
          font-size: 0.92rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .adstats .hbar-track {
          height: 14px;
          background: #f1ecf6;
          border-radius: 4px;
          overflow: hidden;
        }
        .adstats .hbar-fill {
          display: block;
          height: 100%;
          background: #8068a7;
          border-radius: 0 4px 4px 0;
        }
        .adstats .hbar-value {
          min-width: 72px;
          text-align: right;
          font-weight: bold;
          font-size: 0.95rem;
        }
        .adstats .hbar-value small {
          font-weight: normal;
          color: #6f6283;
        }
        .adstats .sr {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        /* Ad set cards */
        .adstats .sets-title {
          margin-bottom: 12px;
        }
        .adstats .ad {
          margin-bottom: 30px;
        }
        .adstats h3 {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin: 0 0 10px;
          font-size: 1.15rem;
          color: #715a99;
        }
        .adstats .off {
          font-size: 0.8rem;
          font-weight: normal;
          padding: 2px 8px;
          border-radius: 999px;
          background: #f1ecf6;
          color: #6f6283;
        }
        .adstats .verdict {
          margin: 0 0 14px;
          padding: 12px 16px;
          border-left: 4px solid #e16d99;
          background: #fff;
          border-radius: 4px;
          font-size: 1rem;
          line-height: 1.5;
        }
        .adstats .funnel {
          display: grid;
          gap: 16px;
          padding: 20px;
          background: #fff;
          border: 1px solid #e6dcef;
          border-radius: 10px;
        }
        .adstats .step-top {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .adstats .num {
          display: inline-grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #efe8f6;
          color: #715a99;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .adstats .label {
          flex: 1;
          font-size: 1.05rem;
        }
        .adstats .count {
          font-size: 1.7rem;
          font-weight: bold;
          color: #715a99;
        }
        .adstats .bar {
          height: 10px;
          margin: 8px 0 6px;
          background: #f1ecf6;
          border-radius: 999px;
          overflow: hidden;
        }
        .adstats .bar span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #a08bc0, #8068a7);
          border-radius: 999px;
        }
        .adstats .hint {
          margin: 0;
          font-size: 0.88rem;
          color: #6f6283;
        }
        .adstats .hint strong {
          color: #3d2f55;
        }
        .adstats .reset {
          margin: -4px 0 10px;
        }
        .adstats .manager {
          margin-top: 6px;
        }
        .adstats .other {
          margin-top: 36px;
        }
        .adstats .extra {
          margin-top: 30px;
          display: flex;
          gap: 16px;
        }
        .adstats .extra a {
          color: #715a99;
        }
      `}</style>
    </>
  );
}
