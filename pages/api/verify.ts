// pages/api/verify.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { SONG_BUCKET, SONGS, songTitle } from "../../lib/songs";

const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const DOWNLOAD_LINK_SECONDS = 60 * 60; // each download link works for 1 hour

type Lang = "en" | "es";

const COPY: Record<
  Lang,
  {
    expiredTitle: string;
    expiredH1: string;
    expiredP: string;
    backBtn: string;
    almostH1: string;
    almostP: string;
    welcomeH1: string;
    confirmed: string;
    download: string;
    next: string;
  }
> = {
  en: {
    expiredTitle: "Link expired",
    expiredH1: "This link has expired",
    expiredP: "Head back to the site and request your song again.",
    backBtn: "BACK TO THE SITE",
    almostH1: "Almost there",
    almostP:
      "Your email is confirmed, but the song isn't available right now. Please check back soon.",
    welcomeH1: "Welcome to la famiglia",
    confirmed: "Your email is confirmed. Your song:",
    download: "DOWNLOAD YOUR SONG",
    next: "Continue to the listener map",
  },
  es: {
    expiredTitle: "Enlace caducado",
    expiredH1: "Este enlace ha caducado",
    expiredP: "Vuelve al sitio y solicita tu canción de nuevo.",
    backBtn: "VOLVER AL SITIO",
    almostH1: "Casi listo",
    almostP:
      "Tu correo está confirmado, pero la canción no está disponible en este momento. Vuelve a intentarlo pronto.",
    welcomeH1: "Te doy la bienvenida a la famiglia",
    confirmed: "Tu correo está confirmado. Tu canción:",
    download: "DESCARGAR MI CANCIÓN",
    next: "Continuar al mapa de oyentes",
  },
};

function page(lang: Lang, title: string, body: string) {
  return `<!doctype html>
<html lang="${lang}"><head>
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
  // Only ever "es" or "en" (safe to put into the page and links below)
  const lang: Lang = req.query.lang === "es" ? "es" : "en";
  const c = COPY[lang];

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const invalid = () =>
    res.status(400).send(
      page(
        lang,
        c.expiredTitle,
        `<h1>${c.expiredH1}</h1>
         <p>${c.expiredP}</p>
         <a class="btn" href="/">${c.backBtn}</a>`
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
        lang,
        c.almostH1,
        `<h1>${c.almostH1}</h1>
         <p>${c.almostP}</p>`
      )
    );
  }

  // After the download, the next step is the listener map (which leads on to /story)
  return res.status(200).send(
    page(
      lang,
      c.welcomeH1,
      `<h1>${c.welcomeH1}</h1>
       <p>${c.confirmed}</p>
       <p class="song">${songTitle(file)}</p>
       <a class="btn" href="${signed.signedUrl}">${c.download}</a>
       <p style="margin:24px 0 0"><a class="home" href="/welcome-map?lang=${lang}">${c.next}</a></p>`
    )
  );
}