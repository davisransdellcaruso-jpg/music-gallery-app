// Private ad stats: daviscaruso.com/ad-stats?key=YOUR_STATS_KEY
// (same key as /signup-stats and /playlist-stats). Add &days=7 or &days=90.
// For each ad page (/s/<slug>): how many people landed on it, how many
// tapped through to Spotify / Apple Music / YouTube, and how many gave an email.
// (How many people saw the ad and clicked it lives in Reddit / Meta Ads Manager.)
// Ads are split into a Reddit side and a Meta side, then grouped by the song
// the ad promotes (ad_landings.platform / ad_landings.song — see
// supabase/ad_landings_platform_song.sql). Rows without those set are sorted
// by their slug: "...reddit..." → Reddit, "meta..." → Meta, "...smitten..." → Smitten.
import { useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const PLATFORMS = [
  { id: "reddit", name: "Reddit", manager: "Reddit Ads Manager" },
  { id: "meta", name: "Meta", manager: "Meta Ads Manager" },
] as const;

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
};

type Props = {
  statsKey: string;
  days: number;
  ads: AdRow[];
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const expected = process.env.STATS_KEY;
  if (!expected || query.key !== expected) return { notFound: true };

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex");

  const days = Math.min(365, Math.max(1, Number(query.days) || 30));
  const rangeStart = new Date(Date.now() - days * 864e5).toISOString();

  // select("*") so the page still works before stats_reset_at exists
  // (see supabase/ad_landings_stats_reset.sql).
  const { data: landings } = await supabaseAdmin
    .from("ad_landings")
    .select("*")
    .order("created_at", { ascending: false });

  const ads: AdRow[] = [];
  for (const landing of landings ?? []) {
    const slug = landing.slug as string;
    const page = `/s/${slug}`;
    // Count from the later of: the start of the chosen range, or this ad's
    // last stats reset. Older rows stay in Supabase, they just aren't counted.
    const resetAt = (landing.stats_reset_at as string | null) ?? null;
    const since =
      resetAt && new Date(resetAt).getTime() > new Date(rangeStart).getTime() ? resetAt : rangeStart;

    // Landed on the page = the signup card on it was shown (bots are already
    // filtered out). Counted once per person, so reloads don't inflate it.
    const { data: events } = await supabaseAdmin
      .from("signup_events")
      .select("event, visitor_id, source, page")
      .gte("created_at", since)
      .or(`page.eq.${page},source.eq.${slug}`)
      .limit(50000);

    const people = new Set<string>();
    let anonymousViews = 0;
    let emails = 0;
    let confirmed = 0;
    for (const e of events ?? []) {
      if (e.event === "shown" && e.page === page) {
        if (e.visitor_id) people.add(e.visitor_id);
        else anonymousViews += 1;
      }
      if (e.event === "submitted" && e.page === page) emails += 1;
      if (e.event === "confirmed" && e.source === slug) confirmed += 1;
    }

    const { data: taps } = await supabaseAdmin
      .from("ad_taps")
      .select("platform")
      .eq("ad_slug", slug)
      .gte("tapped_at", since)
      .limit(50000);

    const count = (p: string) => (taps ?? []).filter((t) => t.platform === p).length;
    const platform = String(landing.platform || guessPlatform(slug)).toLowerCase();
    const song = String(landing.song || guessSong(slug));
    const row: AdRow = {
      slug,
      platform,
      song,
      live: landing.active !== false,
      visitors: people.size + anonymousViews,
      spotify: count("spotify"),
      apple: count("apple"),
      youtube: count("youtube"),
      taps: (taps ?? []).length,
      emails,
      confirmed,
      resetAt,
    };
    ads.push(row);
  }

  return { props: { statsKey: String(query.key), days, ads } };
};

function pct(n: number, d: number) {
  if (!d) return "–";
  return `${Math.round((n / d) * 100)}%`;
}

function verdict(a: AdRow): string {
  if (a.visitors === 0) return "No one has landed on this page yet in this period.";
  if (a.taps === 0)
    return "People are landing here but nobody has tapped a streaming button yet. Check that the clip and buttons look right on a phone.";
  return `${pct(a.taps, a.visitors)} of visitors tapped through to listen.`;
}

function AdCard({ a }: { a: AdRow }) {
  const max = Math.max(1, a.visitors, a.taps, a.emails);
  const steps = [
    {
      label: "Landed on the page",
      hint: `People who opened daviscaruso.com/s/${a.slug}`,
      n: a.visitors,
      rate: "",
    },
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
        {!a.live && <span className="off"> · switched off</span>}
      </h3>
      {a.resetAt && (
        <p className="hint reset">
          Counting since{" "}
          {new Date(a.resetAt).toLocaleString("en-US", {
            timeZone: "America/Detroit",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}{" "}
          (stats reset)
        </p>
      )}
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

function Side({ name, manager, ads }: { name: string; manager: string; ads: AdRow[] }) {
  // Songs in order of their newest ad (ads arrive newest first)
  const songs = Array.from(new Set(ads.map((a) => a.song)));
  const [song, setSong] = useState<string>(songs[0] ?? "");
  const shown = ads.filter((a) => a.song === song);
  const sum = (k: "visitors" | "taps" | "emails") => shown.reduce((t, a) => t + a[k], 0);

  return (
    <div className="side">
      <h2>{name}</h2>
      {songs.length === 0 ? (
        <p className="none">No {name} ads yet.</p>
      ) : (
        <>
          <div className="songs" role="tablist">
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
                <span className="n">{ads.filter((a) => a.song === s).length}</span>
              </button>
            ))}
          </div>
          {shown.length > 1 && (
            <p className="total">
              All {shown.length} {song} ad sets: <strong>{sum("visitors")}</strong> landed ·{" "}
              <strong>{sum("taps")}</strong> tapped to listen ({pct(sum("taps"), sum("visitors"))}) ·{" "}
              <strong>{sum("emails")}</strong> emails
            </p>
          )}
          {shown.map((a) => (
            <AdCard key={a.slug} a={a} />
          ))}
        </>
      )}
      <p className="hint manager">Impressions and cost per click: {manager}.</p>
    </div>
  );
}

export default function AdStats({ statsKey, days, ads }: Props) {
  const link = (d: number) => `?key=${encodeURIComponent(statsKey)}&days=${d}`;
  const others = ads.filter((a) => !PLATFORMS.some((p) => p.id === a.platform));

  return (
    <>
      <Head>
        <title>Ad Stats</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="wrap">
        <header>
          <h1>Ad pages</h1>
          <nav className="range">
            {[7, 30, 90].map((d) => (
              <a key={d} href={link(d)} className={d === days ? "on" : ""}>
                {d} days
              </a>
            ))}
          </nav>
        </header>

        {ads.length === 0 && <p className="verdict">No ad pages yet. Add one in Supabase → ad_landings.</p>}

        <div className="sides">
          {PLATFORMS.map((p) => (
            <Side key={p.id} name={p.name} manager={p.manager} ads={ads.filter((a) => a.platform === p.id)} />
          ))}
        </div>

        {others.length > 0 && (
          <div className="side other">
            <h2>Other ad pages</h2>
            <p className="hint">Set platform to reddit or meta on these rows in ad_landings to sort them.</p>
            {others.map((a) => (
              <AdCard key={a.slug} a={a} />
            ))}
          </div>
        )}

        <section className="extra">
          <p>
            Compare the clicks in each Ads Manager with &ldquo;Landed on the page&rdquo;
            to see how many leave before the page loads.
          </p>
          <p>
            <a href={`/signup-stats${link(days)}`}>Email signups →</a>{" "}
            <a href={`/playlist-stats?key=${encodeURIComponent(statsKey)}`}>Playlist taps →</a>
          </p>
        </section>
      </main>

      <style jsx global>{`
        html,
        body {
          background: #f7efe9 !important;
          color: #3d2f55 !important;
        }
      `}</style>

      <style jsx>{`
        .wrap {
          max-width: 1240px;
          margin: 0 auto;
          padding: 40px 16px 64px;
          font-family: Georgia, serif;
          color: #3d2f55;
        }
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }
        h1 {
          margin: 0;
          font-size: 2rem;
          color: #715a99;
        }
        .range {
          display: flex;
          gap: 6px;
        }
        .range a {
          padding: 6px 12px;
          border: 1px solid #cbbde0;
          border-radius: 999px;
          color: #715a99;
          font-size: 0.85rem;
          text-decoration: none;
          background: #fff;
        }
        .range a.on {
          background: #715a99;
          border-color: #715a99;
          color: #fff;
        }
        .warn {
          padding: 12px 16px;
          border: 1px solid #e16d99;
          background: #fdf0f4;
          border-radius: 6px;
        }
        .verdict {
          margin: 0 0 24px;
          padding: 14px 18px;
          border-left: 4px solid #e16d99;
          background: #fff;
          border-radius: 4px;
          font-size: 1.05rem;
          line-height: 1.5;
        }
        .funnel {
          display: grid;
          gap: 18px;
          padding: 22px;
          background: #fff;
          border: 1px solid #e6dcef;
          border-radius: 8px;
          margin-bottom: 36px;
        }
        .step-top {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .num {
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
        .label {
          flex: 1;
          font-size: 1.1rem;
        }
        .count {
          font-size: 1.8rem;
          font-weight: bold;
          color: #715a99;
        }
        .bar {
          height: 10px;
          margin: 8px 0 6px;
          background: #f1ecf6;
          border-radius: 999px;
          overflow: hidden;
        }
        .bar span {
          display: block;
          height: 100%;
          min-width: 0;
          background: linear-gradient(90deg, #a08bc0, #8068a7);
          border-radius: 999px;
        }
        .hint {
          margin: 0;
          font-size: 0.88rem;
          color: #6f6283;
        }
        .hint strong {
          color: #3d2f55;
        }
        h2 {
          margin: 0 0 10px;
          font-size: 1.25rem;
          color: #715a99;
        }
        .table-wrap {
          overflow-x: auto;
          background: #fff;
          border: 1px solid #e6dcef;
          border-radius: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }
        th,
        td {
          padding: 12px 14px;
          text-align: left;
          white-space: nowrap;
          border-bottom: 1px solid #f1ecf6;
        }
        th {
          font-size: 0.78rem;
          font-weight: normal;
          color: #6f6283;
        }
        tbody tr:last-child td {
          border-bottom: 0;
        }
        .src {
          font-weight: bold;
        }
        .none {
          color: #6f6283;
          font-style: italic;
        }
        .extra {
          margin-top: 28px;
          color: #6f6283;
          line-height: 1.5;
        }
        .extra p {
          margin: 0 0 6px;
        }
        .extra strong {
          color: #3d2f55;
        }
        .ad {
          margin-bottom: 32px;
        }
        .sides {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .sides {
            grid-template-columns: 1fr;
          }
        }
        .side {
          padding: 22px;
          background: #fbf7fd;
          border: 1px solid #e6dcef;
          border-radius: 12px;
          min-width: 0;
        }
        .side.other {
          margin-top: 28px;
        }
        .side h2 {
          font-size: 1.6rem;
          margin-bottom: 14px;
        }
        h3 {
          margin: 0 0 10px;
          font-size: 1.1rem;
          color: #715a99;
        }
        .off {
          font-size: 0.85rem;
          font-weight: normal;
          color: #6f6283;
        }
        .songs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }
        .songs button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #cbbde0;
          border-radius: 999px;
          background: #fff;
          color: #715a99;
          font-family: Georgia, serif;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .songs button.on {
          background: #715a99;
          border-color: #715a99;
          color: #fff;
        }
        .songs .n {
          font-size: 0.75rem;
          padding: 1px 7px;
          border-radius: 999px;
          background: rgba(113, 90, 153, 0.12);
        }
        .songs button.on .n {
          background: rgba(255, 255, 255, 0.25);
        }
        .total {
          margin: 0 0 18px;
          font-size: 0.95rem;
          color: #6f6283;
        }
        .total strong {
          color: #3d2f55;
        }
        .manager {
          margin-top: 4px;
        }
        .reset {
          margin: -4px 0 12px;
        }
        .extra a {
          color: #715a99;
          margin-right: 14px;
        }
      `}</style>
    </>
  );
}
