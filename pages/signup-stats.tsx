// Private signup funnel: daviscaruso.com/signup-stats?key=YOUR_STATS_KEY
// (same key as /playlist-stats). Add &days=7 or &days=90 to change the window.
// Shows how many people saw the email popup, gave an email, and confirmed it,
// overall and per link source (?src=ig, ?src=tt, ...).
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { supabaseAdmin } from "../lib/supabaseAdmin";

type Counts = {
  source: string;
  shown: number;
  button: number;
  dismissed: number;
  submitted: number;
  confirmed: number;
};

type Props = {
  statsKey: string;
  days: number;
  rows: Counts[];
  total: Counts;
  listTotal: number | null;
  listConfirmed: number | null;
  tableMissing: boolean;
};

const SOURCE_NAMES: Record<string, string> = {
  ig: "Instagram",
  tt: "TikTok",
  fb: "Facebook",
  yt: "YouTube",
  qr: "QR code",
  substack: "Substack",
  direct: "Direct / other",
};

const empty = (source: string): Counts => ({
  source,
  shown: 0,
  button: 0,
  dismissed: 0,
  submitted: 0,
  confirmed: 0,
});

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const expected = process.env.STATS_KEY;
  if (!expected || query.key !== expected) return { notFound: true };

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex");

  const days = Math.min(365, Math.max(1, Number(query.days) || 30));
  const since = new Date(Date.now() - days * 864e5).toISOString();

  const { data: events, error } = await supabaseAdmin
    .from("signup_events")
    .select("event, source, visitor_id")
    .gte("created_at", since)
    .limit(50000);

  // "Shown" counts people, not popups, so someone who reloads counts once
  const bySource: Record<string, Counts> = {};
  const seen = new Set<string>();
  for (const e of events ?? []) {
    const src = e.source || "direct";
    const row = (bySource[src] ??= empty(src));
    if (e.event === "shown" && e.visitor_id) {
      const k = `${src}:${e.visitor_id}`;
      if (seen.has(k)) continue;
      seen.add(k);
    }
    if (e.event in row) (row as unknown as Record<string, number>)[e.event] += 1;
  }

  const rows = Object.values(bySource).sort(
    (a, b) => b.submitted - a.submitted || b.shown - a.shown
  );
  const total = rows.reduce((t, r) => {
    t.shown += r.shown;
    t.button += r.button;
    t.dismissed += r.dismissed;
    t.submitted += r.submitted;
    t.confirmed += r.confirmed;
    return t;
  }, empty("All"));

  const { count: listTotal } = await supabaseAdmin
    .from("mailing_list")
    .select("email", { count: "exact", head: true });
  const { count: listConfirmed } = await supabaseAdmin
    .from("mailing_list")
    .select("email", { count: "exact", head: true })
    .eq("verified", true);

  return {
    props: {
      statsKey: String(query.key),
      days,
      rows,
      total,
      listTotal: listTotal ?? null,
      listConfirmed: listConfirmed ?? null,
      tableMissing: Boolean(error),
    },
  };
};

function pct(n: number, d: number) {
  if (!d) return "–";
  return `${Math.round((n / d) * 100)}%`;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

// The one sentence that says what's going on and what to look at
function verdict(t: Counts): string {
  if (t.shown === 0) return "No one has seen the offer yet in this period.";
  if (t.submitted === 0)
    return "People are seeing the offer but no one has signed up yet. Give it more visitors before changing anything.";
  if (t.confirmed < t.submitted * 0.6)
    return "A lot of people sign up but don't confirm. The email may be landing in spam or Promotions.";
  return "Most people who sign up go on to confirm. To grow the list, focus on getting more people to see the offer.";
}

export default function SignupStats({
  statsKey,
  days,
  rows,
  total,
  listTotal,
  listConfirmed,
  tableMissing,
}: Props) {
  const steps = [
    {
      label: "Saw the song offer",
      hint: "People who saw the popup, the /song page, or tapped the button",
      n: total.shown,
      rate: "",
    },
    {
      label: "Gave their email",
      hint: "Typed their email and sent it",
      n: total.submitted,
      rate: total.shown ? `${pct(total.submitted, total.shown)} of people who saw it` : "",
    },
    {
      label: "Confirmed",
      hint: "Tapped the link in the email and got the song",
      n: total.confirmed,
      rate: total.submitted ? `${pct(total.confirmed, total.submitted)} of people who gave an email` : "",
    },
  ];
  const max = Math.max(1, total.shown, total.submitted, total.confirmed);
  const link = (d: number) => `?key=${encodeURIComponent(statsKey)}&days=${d}`;

  return (
    <>
      <Head>
        <title>Signup Stats</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="wrap">
        <header>
          <h1>Email signups</h1>
          <nav className="range">
            {[7, 30, 90].map((d) => (
              <a key={d} href={link(d)} className={d === days ? "on" : ""}>
                {d} days
              </a>
            ))}
          </nav>
        </header>

        {tableMissing && (
          <p className="warn">
            Tracking isn&apos;t set up yet. Run supabase/signup_events.sql in
            the Supabase SQL Editor and numbers will start appearing here.
          </p>
        )}

        <p className="verdict">{verdict(total)}</p>

        <section className="funnel">
          {steps.map((step, i) => (
            <div key={step.label} className="step">
              <div className="step-top">
                <span className="num">{i + 1}</span>
                <span className="label">{step.label}</span>
                <span className="count">{step.n}</span>
              </div>
              <div className="bar">
                <span style={{ width: `${(step.n / max) * 100}%` }} />
              </div>
              <p className="hint">
                {step.hint}
                {step.rate && <strong> · {step.rate}</strong>}
              </p>
            </div>
          ))}
        </section>

        <h2>Where they came from</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Link</th>
                <th>Saw offer</th>
                <th>Gave email</th>
                <th>Confirmed</th>
                <th>Signup rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="none">
                    Nothing yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.source}>
                  <td className="src">{SOURCE_NAMES[r.source] ?? r.source}</td>
                  <td>{r.shown}</td>
                  <td>{r.submitted}</td>
                  <td>{r.confirmed}</td>
                  <td>{pct(r.submitted, r.shown)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="extra">
          <p>
            <strong>{plural(total.dismissed, "person", "people")}</strong>{" "}
            closed the popup without signing up.
          </p>
          <p>
            <strong>{plural(total.button, "tap", "taps")}</strong> on the
            &ldquo;Get an unreleased song&rdquo; button.
          </p>
          <p>
            Your whole mailing list:{" "}
            <strong>{listTotal ?? "?"} addresses</strong>,{" "}
            {listConfirmed ?? "?"} confirmed (all time).
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
          max-width: 760px;
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
      `}</style>
    </>
  );
}
