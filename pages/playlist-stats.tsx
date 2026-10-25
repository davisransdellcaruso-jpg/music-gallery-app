// Private leaderboard: daviscaruso.com/playlist-stats?key=YOUR_STATS_KEY
// Shows which businesses tap their playlist link the most.
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { supabaseAdmin } from "../lib/supabaseAdmin";

type Row = {
  slug: string;
  name: string;
  active: boolean;
  total_taps: number;
  taps_7d: number;
  taps_30d: number;
  active_days: number;
  active_days_30d: number;
  spotify_taps_30d: number;
  apple_taps_30d: number;
  last_tap: string | null;
};

type Props = { rows: Row[]; unknown: { slug: string; taps: number }[] };

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const expected = process.env.STATS_KEY;
  if (!expected || query.key !== expected) return { notFound: true };

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex");

  const { data: stats } = await supabaseAdmin
    .from("playlist_stats")
    .select("*")
    // Rank by how many separate days each business played it this month,
    // then by taps to break ties
    .order("active_days_30d", { ascending: false })
    .order("taps_30d", { ascending: false })
    .order("total_taps", { ascending: false });

  // Taps on slugs you haven't added yet (typos, or a business you forgot to enter)
  const known = new Set((stats ?? []).map((r: Row) => r.slug));
  const { data: taps } = await supabaseAdmin
    .from("playlist_taps")
    .select("business_slug")
    .gte("tapped_at", new Date(Date.now() - 30 * 864e5).toISOString())
    .limit(5000);

  const counts: Record<string, number> = {};
  for (const t of taps ?? []) {
    if (!known.has(t.business_slug)) counts[t.business_slug] = (counts[t.business_slug] ?? 0) + 1;
  }
  const unknown = Object.entries(counts)
    .map(([slug, n]) => ({ slug, taps: n }))
    .sort((a, b) => b.taps - a.taps);

  return { props: { rows: (stats ?? []) as Row[], unknown } };
};

function ago(iso: string | null) {
  if (!iso) return "never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function PlaylistStats({ rows, unknown }: Props) {
  const total30 = rows.reduce((s, r) => s + Number(r.taps_30d), 0);
  const participating = rows.filter((r) => Number(r.taps_30d) > 0).length;

  return (
    <>
      <Head>
        <title>Playlist Stats</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="wrap">
        <h1>Business Playlist</h1>
        <p className="sub">
          {participating} of {rows.length} businesses active in the last 30 days · {total30} taps
        </p>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Business</th>
                <th>Days played (30d)</th>
                <th>Taps 7d</th>
                <th>Taps 30d</th>
                <th>Spotify / Apple</th>
                <th>All-time taps</th>
                <th>All-time days</th>
                <th>Last tap</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.slug} className={r.active ? "" : "inactive"}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="name">{r.name}</div>
                    <div className="slug">/play/{r.slug}</div>
                  </td>
                  <td className="strong">{r.active_days_30d}</td>
                  <td>{r.taps_7d}</td>
                  <td>{r.taps_30d}</td>
                  <td>
                    {r.spotify_taps_30d} / {r.apple_taps_30d}
                  </td>
                  <td>{r.total_taps}</td>
                  <td>{r.active_days}</td>
                  <td>{ago(r.last_tap)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">
                    No businesses yet. Add them in Supabase → playlist_businesses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {unknown.length > 0 && (
          <section className="unknown">
            <h2>Taps on links not in your list</h2>
            <ul>
              {unknown.map((u) => (
                <li key={u.slug}>
                  /play/{u.slug} — {u.taps}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: #1c1410;
          color: #f1e6d6;
          font-family: Georgia, "Times New Roman", serif;
          padding: 40px 16px;
          max-width: 960px;
          margin: 0 auto;
        }
        h1 {
          color: #c9a45c;
          font-weight: normal;
          letter-spacing: 0.04em;
          margin: 0 0 6px;
        }
        .sub {
          opacity: 0.75;
          margin: 0 0 28px;
        }
        .tableWrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-family: system-ui, sans-serif;
          font-size: 14px;
        }
        th {
          text-align: left;
          color: #c9a45c;
          font-weight: 600;
          border-bottom: 1px solid #4a3a2c;
          padding: 10px 8px;
          white-space: nowrap;
        }
        td {
          border-bottom: 1px solid #2e231b;
          padding: 10px 8px;
          white-space: nowrap;
        }
        .name {
          font-weight: 600;
        }
        .slug {
          opacity: 0.55;
          font-size: 12px;
        }
        .strong {
          color: #e8c77f;
          font-weight: 700;
        }
        .inactive {
          opacity: 0.45;
        }
        .empty {
          text-align: center;
          opacity: 0.6;
          padding: 30px;
        }
        .unknown {
          margin-top: 36px;
          font-family: system-ui, sans-serif;
          font-size: 14px;
        }
        .unknown h2 {
          font-size: 15px;
          color: #c9a45c;
        }
      `}</style>
    </>
  );
}