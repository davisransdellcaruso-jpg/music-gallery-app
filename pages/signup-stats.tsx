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

export default function SignupStats({
  days,
  rows,
  total,
  listTotal,
  listConfirmed,
  tableMissing,
}: Props) {
  return (
    <>
      <Head>
        <title>Signup Stats</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="wrap">
        <h1>Email Signups</h1>
        <p className="sub">Last {days} days</p>

        {tableMissing && (
          <p className="warn">
            The signup_events table isn&apos;t set up yet. Run
            supabase/signup_events.sql in the Supabase SQL Editor and numbers
            will start appearing here.
          </p>
        )}

        <section className="cards">
          <div className="card">
            <span className="big">{total.shown}</span>
            <span>saw the offer</span>
          </div>
          <div className="card">
            <span className="big">{total.submitted}</span>
            <span>gave an email ({pct(total.submitted, total.shown)})</span>
          </div>
          <div className="card">
            <span className="big">{total.confirmed}</span>
            <span>confirmed ({pct(total.confirmed, total.submitted)})</span>
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Saw offer</th>
              <th>Tapped button</th>
              <th>Closed it</th>
              <th>Gave email</th>
              <th>Confirmed</th>
              <th>Signup rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="none">
                  Nothing yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.source}>
                <td>{SOURCE_NAMES[r.source] ?? r.source}</td>
                <td>{r.shown}</td>
                <td>{r.button}</td>
                <td>{r.dismissed}</td>
                <td>{r.submitted}</td>
                <td>{r.confirmed}</td>
                <td>{pct(r.submitted, r.shown)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="foot">
          Whole mailing list: {listTotal ?? "?"} addresses, {listConfirmed ?? "?"} confirmed.
          <br />
          &ldquo;Signup rate&rdquo; is emails given ÷ people who saw the offer.
          Low &ldquo;confirmed&rdquo; compared with &ldquo;gave email&rdquo; means
          the email is landing in spam or not getting opened.
        </p>
      </main>

      <style jsx>{`
        .wrap {
          max-width: 860px;
          margin: 0 auto;
          padding: 40px 16px;
          font-family: Georgia, serif;
          color: #3d2f55;
        }
        h1 {
          margin: 0;
        }
        .sub {
          margin: 4px 0 24px;
          opacity: 0.7;
        }
        .warn {
          padding: 12px 16px;
          border: 1px solid #e16d99;
          background: #fdf0f4;
        }
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 28px;
        }
        .card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
          border: 1px solid #d9cfe6;
          background: #fbf8fd;
        }
        .big {
          font-size: 2rem;
          font-weight: bold;
          color: #715a99;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.92rem;
          display: block;
          overflow-x: auto;
        }
        th,
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
          text-align: left;
          white-space: nowrap;
        }
        th {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.7;
        }
        .none {
          opacity: 0.6;
          font-style: italic;
        }
        .foot {
          margin-top: 20px;
          font-size: 0.85rem;
          opacity: 0.75;
          line-height: 1.6;
        }
      `}</style>
    </>
  );
}
