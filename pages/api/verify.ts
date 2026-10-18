import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { SONG_BUCKET, SONGS, songTitle } from "../../lib/songs";

const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const DOWNLOAD_LINK_SECONDS = 60 * 60; // each download link works for 1 hour

function page(title: string, body: string) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,600&display=swap" rel="stylesheet" />
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;
       background:linear-gradient(180deg,#fbf5f0,#f3d7d3);font-family:"Fraunces",Georgia,serif;color:#715a99;text-align:center}
  .card{max-width:440px;width:100%;padding:40px 32px;border:1px solid rgba(212,173,86,.65);background:rgba(251,245,240,.8)}
  h1{font-style:italic;font-size:1.7rem;margin:0 0 12px}
  p{line-height:1.6;margin:0 0 24px}
  .song{font-style:italic;font-size:1.25rem;margin:0 0 24px}
  a.btn{display:block;padding:16px;border:1px solid #9680b8;background:linear-gradient(135deg,#a08bc0,#8068a7);
        color:#fffaf7;text-decoration:none;letter-spacing:.15em;font-size:.95rem;font-weight:600}
  a.home{color:#9680b8;font-size:.85rem}
</style></head>
<body><div class="card">${body}</div></body></html>`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = String(req.query.token || "");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const invalid = () =>
    res.status(400).send(
      page(
        "Link expired",
        `<h1>This link has expired</h1>
         <p>Head back to the site and request your song again.</p>
         <a class="btn" href="/">BACK TO THE SITE</a>`
      )
    );

  if (!/^[0-9a-f-]{36}$/i.test(token)) return invalid();

  const { data: row } = await supabaseAdmin
    .from("mailing_list")
    .select("email, token_sent_at, song_index")
    .eq("verify_token", token)
    .maybeSingle();

  if (
    !row ||
    !row.token_sent_at ||
    Date.now() - new Date(row.token_sent_at).getTime() > TOKEN_LIFETIME_MS
  ) {
    return invalid();
  }

  await supabaseAdmin
    .from("mailing_list")
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq("verify_token", token);

  const file = SONGS[(row.song_index ?? 0) % SONGS.length];

  // A fresh, temporary download link made on the spot. The bucket can stay private.
  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from(SONG_BUCKET)
    .createSignedUrl(file, DOWNLOAD_LINK_SECONDS, { download: true });

  if (signError || !signed?.signedUrl) {
    console.error(signError);
    return res.status(500).send(
      page(
        "Almost there",
        `<h1>Almost there</h1>
         <p>Your email is confirmed, but the song isn't available right now. Please check back soon.</p>`
      )
    );
  }

  return res.status(200).send(
    page(
      "Welcome to la famiglia",
      `<h1>Welcome to la famiglia</h1>
       <p>Your email is confirmed. Your song:</p>
       <p class="song">${songTitle(file)}</p>
       <a class="btn" href="${signed.signedUrl}">DOWNLOAD YOUR SONG</a>
       <p style="margin:24px 0 0"><a class="home" href="/story">Continue to the site</a></p>`
    )
  );
}