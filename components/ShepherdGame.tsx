// pages/game.tsx
import Head from "next/head";
import ShepherdGame from "../components/ShepherdGame";
import { useLang } from "../components/i18n";

export default function GamePage() {
  const { lang } = useLang();
  const l = lang === "es" ? "es" : "en";
  return (
    <>
      <Head>
        <title>{l === "es" ? "Juego" : "Game"} · Davis Caruso</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          padding: "28px 14px 48px",
          background: "linear-gradient(180deg, #fbf5f0 0%, #f7efe9 55%, #f3d7d3 100%)",
          fontFamily: '"Fraunces", Georgia, serif',
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto 16px" }}>
          <a href={`/gallery?lang=${l}`} style={{ color: "#715a99", textDecoration: "none", fontSize: 15 }}>
            {l === "es" ? "← Galería" : "← Gallery"}
          </a>
        </div>
        <ShepherdGame />
      </main>

      <style jsx global>{`
        body {
          margin: 0;
          background: #f7efe9;
          overscroll-behavior: none;
        }
      `}</style>
    </>
  );
}