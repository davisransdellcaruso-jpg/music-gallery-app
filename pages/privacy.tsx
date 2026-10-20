// pages/privacy.tsx
// Plain-language privacy page, English + Spanish.
import Head from "next/head";
import { useLang } from "../components/i18n";

const EMAIL = "davisransdellcaruso@gmail.com";
const UPDATED = { en: "October 19, 2026", es: "19 de octubre de 2026" };

type Section = { h: string; p: string[] };

const COPY = {
  en: {
    title: "Privacy",
    back: "← Back to the gallery",
    intro:
      "I'm Davis Caruso, an independent artist, and I run this site myself. Here is, in plain words, what it collects and why. I don't sell your information.",
    updated: "Last updated",
    sections: [
      {
        h: "Visiting the site",
        p: [
          "I use Vercel Web Analytics to count visits: which pages are opened, roughly which country people are in, what kind of device they use, and what site sent them here. It doesn't use cookies and doesn't follow you from site to site.",
          "To guess your city for the welcome message, your visit is looked up with a location service (ipapi.co), which sees your IP address. The result is approximate and I don't keep your IP address for this.",
        ],
      },
      {
        h: "Joining the email list",
        p: [
          "If you add your email to get a song, I store your email address and the approximate place you visited from (city, region, country). I use it to send you the song and occasional news about music and shows. Every email can be unsubscribed from, and you can ask me to delete you at any time.",
        ],
      },
      {
        h: "The Map of La Famiglia",
        p: [
          "If you add yourself, I store the name or nickname you enter, your city, the lyrics you share and your mood emoji. I read each one before it goes on the map, and once approved it is public for anyone to see. Please don't share anything you want kept private.",
          "The faint red dots are listeners grouped by area. They carry no names.",
          "To limit spam, I keep a scrambled (hashed) version of your IP address that I can't turn back into the original. Searching for a city sends the text you type to a map search service (Open-Meteo or OpenStreetMap's Nominatim). The map itself loads tiles from Esri and elevation data from Amazon, so those services see your IP address like any website you visit.",
        ],
      },
      {
        h: "Saved on your device",
        p: [
          "The site remembers a few things in your own browser, not on my servers: your language, whether you've added yourself to the map (so you can update your mood), and whether you closed a reminder. This is only for convenience, and you can clear it any time in your browser settings.",
        ],
      },
      {
        h: "Who helps run the site",
        p: [
          "Vercel hosts the site. Supabase stores the database and files. Trusted services send email. They handle your information only to run the site for me.",
        ],
      },
      {
        h: "Ads for my music",
        p: [
          "I may advertise my music on platforms like Instagram, Facebook, TikTok and YouTube. Those platforms run the ads and have their own privacy rules, and I don't get your personal details from them. I only see totals, such as how many people saw an ad or clicked it.",
          "Right now this site doesn't use advertising trackers. If I add them, which is how an ad platform can tell that someone who saw an ad later visited my site, I'll ask your permission first where the law requires it, give you a clear way to say no, and update this page before it starts.",
        ],
      },
      {
        h: "Your choices",
        p: [
          `Want to see, fix or delete what I have about you, including your map pin or email? Write to ${EMAIL} and I'll take care of it.`,
          "If I change this page, the date at the top will change too.",
        ],
      },
    ] as Section[],
  },
  es: {
    title: "Privacidad",
    back: "← Volver a la galería",
    intro:
      "Soy Davis Caruso, artista independiente, y manejo este sitio yo mismo. Aquí te explico con palabras sencillas qué recopila y por qué. No vendo tu información.",
    updated: "Última actualización",
    sections: [
      {
        h: "Cuando visitas el sitio",
        p: [
          "Uso Vercel Web Analytics para contar visitas: qué páginas se abren, más o menos de qué país son, qué tipo de dispositivo usan y desde qué sitio llegaron. No usa cookies y no te sigue de un sitio a otro.",
          "Para adivinar tu ciudad en el mensaje de bienvenida, tu visita se consulta con un servicio de ubicación (ipapi.co), que ve tu dirección IP. El resultado es aproximado y yo no guardo tu IP para esto.",
        ],
      },
      {
        h: "Unirte a la lista de correo",
        p: [
          "Si agregas tu correo para recibir una canción, guardo tu dirección de correo y el lugar aproximado desde el que visitaste (ciudad, región, país). Lo uso para enviarte la canción y, de vez en cuando, noticias sobre música y shows. Puedes darte de baja desde cualquier correo y puedes pedirme que te elimine cuando quieras.",
        ],
      },
      {
        h: "El Mapa de La Famiglia",
        p: [
          "Si te agregas, guardo el nombre o apodo que escribas, tu ciudad, la letra que compartas y tu emoji de ánimo. Reviso cada uno antes de que aparezca en el mapa y, una vez aprobado, es público para cualquiera. Por favor no compartas nada que quieras mantener privado.",
          "Los puntos rojos tenues son oyentes agrupados por zona. No llevan nombres.",
          "Para evitar el spam, guardo una versión codificada (hash) de tu IP que no puedo convertir de nuevo en la original. Al buscar una ciudad, el texto que escribes se envía a un servicio de búsqueda en mapas (Open-Meteo o Nominatim de OpenStreetMap). El mapa carga imágenes de Esri y datos de elevación de Amazon, así que esos servicios ven tu IP como cualquier sitio web que visitas.",
        ],
      },
      {
        h: "Guardado en tu dispositivo",
        p: [
          "El sitio recuerda algunas cosas en tu propio navegador, no en mis servidores: tu idioma, si ya te agregaste al mapa (para que puedas actualizar tu ánimo) y si cerraste un recordatorio. Es solo por comodidad y puedes borrarlo cuando quieras en los ajustes de tu navegador.",
        ],
      },
      {
        h: "Quién ayuda a mantener el sitio",
        p: [
          "Vercel aloja el sitio. Supabase guarda la base de datos y los archivos. Servicios de confianza envían los correos. Manejan tu información solo para que el sitio funcione.",
        ],
      },
      {
        h: "Anuncios de mi música",
        p: [
          "Es posible que anuncie mi música en plataformas como Instagram, Facebook, TikTok y YouTube. Esas plataformas muestran los anuncios y tienen sus propias reglas de privacidad; yo no recibo tus datos personales de ellas. Solo veo totales, como cuántas personas vieron un anuncio o hicieron clic.",
          "Por ahora este sitio no usa rastreadores de publicidad. Si los agrego, que es la forma en que una plataforma de anuncios puede saber que alguien que vio un anuncio luego visitó mi sitio, primero te pediré permiso donde la ley lo exija, te daré una forma clara de decir que no y actualizaré esta página antes de que empiece.",
        ],
      },
      {
        h: "Tus opciones",
        p: [
          `¿Quieres ver, corregir o eliminar lo que tengo sobre ti, incluido tu pin en el mapa o tu correo? Escríbeme a ${EMAIL} y me encargo.`,
          "Si cambio esta página, la fecha de arriba también cambiará.",
        ],
      },
    ] as Section[],
  },
};

export default function Privacy() {
  const { lang } = useLang();
  const l = lang === "es" ? "es" : "en";
  const c = COPY[l];

  return (
    <>
      <Head>
        <title>{c.title} · Davis Caruso</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className="wrap">
        <article>
          <a className="back" href={`/gallery?lang=${l}`}>{c.back}</a>
          <h1>{c.title}</h1>
          <p className="meta">
            {c.updated}: {UPDATED[l]}
          </p>
          <p className="intro">{c.intro}</p>

          {c.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </section>
          ))}
        </article>
      </main>

      <style jsx global>{`
        body {
          margin: 0;
          background: #f7efe9;
        }
      `}</style>
      <style jsx>{`
        .wrap {
          min-height: 100vh;
          padding: 56px 20px 80px;
          background: linear-gradient(180deg, #fbf5f0 0%, #f7efe9 60%, #f3d7d3 100%);
          font-family: "Fraunces", Georgia, serif;
          color: #3a2a55;
        }
        article {
          max-width: 640px;
          margin: 0 auto;
        }
        .back {
          color: #715a99;
          text-decoration: none;
          font-size: 15px;
        }
        h1 {
          margin: 28px 0 4px;
          font-size: clamp(34px, 7vw, 48px);
          font-weight: 600;
        }
        .meta {
          margin: 0 0 22px;
          color: #9680b8;
          font-size: 14px;
        }
        .intro {
          font-size: 19px;
          line-height: 1.6;
          font-style: italic;
          color: #715a99;
        }
        section {
          margin-top: 34px;
          padding-top: 22px;
          border-top: 1px solid rgba(212, 173, 86, 0.55);
        }
        h2 {
          margin: 0 0 10px;
          font-size: 22px;
          font-weight: 600;
          color: #e16d99;
        }
        p {
          font-size: 17px;
          line-height: 1.65;
          margin: 0 0 12px;
        }
      `}</style>
    </>
  );
}