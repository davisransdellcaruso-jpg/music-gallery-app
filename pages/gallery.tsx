import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import Image from "next/image";

type Album = {
  id: string;
  title: string;
  year: number;
  cover_url: string;
};

export default function Gallery() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [locationDetected, setLocationDetected] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAlbums = async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .order("year", { ascending: true });

      if (error) console.error(error);
      else setAlbums((data as Album[]) || []);

      setLoading(false);
      setTimeout(() => setFadeIn(true), 100);
    };

    fetchAlbums();

    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const detected = [data.city, data.region, data.country_name]
          .filter(Boolean)
          .join(", ");
        setLocationDetected(detected);
        setLocation(detected);
      })
      .catch(() => {});
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!email) return setMessage("Please enter your email.");

    const { error } = await supabase.from("mailing_list").insert([{
      email,
      location: location || locationDetected || null,
      location_detected: locationDetected || null,
    }]);

    if (error) {
      if ((error as any).code === "23505") {
        setMessage("You're already on the list.");
      } else {
        setMessage("Error: " + error.message);
      }
    } else {
      setMessage("Welcome to the list.");
      setEmail("");
      setLocation("");
      setLocationDetected("");
    }
  };

  if (loading) return (
    <div style={{
      minHeight: "100vh",
      background: "#1a1410",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#c9a24d",
      fontFamily: "Trocchi, serif",
      letterSpacing: "0.12em",
      fontSize: "0.85rem",
    }}>
      Loading…
    </div>
  );

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
        rel="stylesheet"
      />

      {/* Animated border frame */}
      <div className="gradient-border-frame" aria-hidden="true" />

      {/* Grain texture overlay */}
      <div className="grain-overlay" aria-hidden="true" />

      <div className={`gallery-page ${fadeIn ? "fade-in" : ""}`}>

        {/* Stage glow behind title */}
        <div className="stage-glow" aria-hidden="true" />

        <div style={{ height: "3.5rem" }} />

        {/* TITLE */}
        <div className="title-block">
          <p className="eyebrow">Davis Caruso</p>
          <h1 className="brand-title">
            <span>DAV</span><span className="title-i">i</span><span>S</span>
          </h1>
          <div className="title-rule">
            <span className="rule-line" />
            <span className="rule-diamond">◆</span>
            <span className="rule-line" />
          </div>
        </div>

        {/* TICKET LINK */}
        <div className="ticket-link-wrapper">
          <a
            href="https://theark.org/event/an-intimate-evening-with-davis-caruso/"
            target="_blank"
            rel="noopener noreferrer"
            className="ticket-link"
          >
            <span className="ticket-inner">
              <span className="ticket-venue">The Ark · Ann Arbor</span>
              <span className="ticket-cta">Davis Caruso Trio — July 24th →</span>
            </span>
          </a>
        </div>

        {/* FEATURED VIDEO */}
        <div className="video-outer">
          <div className="video-wrapper">
            <iframe
              src="https://www.youtube.com/embed/dSE6G5vTX40"
              title="DAViS featured video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* SECTION RULE */}
        <div className="section-rule">
          <span className="rule-line" />
          <span className="rule-diamond small">◆</span>
          <span className="rule-line" />
        </div>

        {/* ALBUMS */}
        <div className="album-grid">
          {albums.map((album) => (
            <div
              key={album.id}
              className="album-card"
              onClick={() => router.push(`/album/${album.id}`)}
            >
              <div className="vinyl">
                {/* Groove rings */}
                <div className="groove-rings" aria-hidden="true" />

                <div className="vinyl-center">
                  <Image
                    src={album.cover_url}
                    alt={album.title}
                    width={120}
                    height={120}
                    className="vinyl-label"
                  />
                  <div className="vinyl-sheen" aria-hidden="true" />
                  <div className="center-hole" />
                </div>
              </div>

              <h2 className="album-title">{album.title}</h2>
              <p className="album-year">{album.year}</p>
            </div>
          ))}
        </div>

        {/* SOCIAL + MAILING */}
        <div className="support-section">
          <div className="section-rule" style={{ marginBottom: "3rem" }}>
            <span className="rule-line" />
            <span className="rule-diamond small">◆</span>
            <span className="rule-line" />
          </div>

          <p className="support-title">see you soon</p>

          <div className="social-icons">
            {/* Instagram */}
            <a href="https://www.instagram.com/dav_wav_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" />
              </svg>
            </a>

            {/* TikTok */}
            <a href="https://www.tiktok.com/@dav_wav_?_t=ZT-90R8qRubZ2E&_r=1" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
                <path d="M180.7 53.4c9.8 9.4 22.7 15.4 37.2 16.3v40.5c-13.3-.1-26.5-2.7-38.9-7.7v61.9c0 47.8-38.7 86.6-86.5 86.6-47.9 0-86.5-38.8-86.5-86.6 0-47.9 38.7-86.6 86.5-86.6 4.7 0 9.4.4 14 1.2v43.7c-4.5-1.4-9.2-2.1-14-2.1-24.3 0-44 19.8-44 44.1 0 24.3 19.8 44.1 44 44.1 24.2 0 44-19.8 44-44.1V12h43.7c.8 14.6 6.8 27.5 16.5 37.4z" />
              </svg>
            </a>

            {/* Facebook */}
            <a href="https://www.facebook.com/DavisCarusoMusic/?rdid=nTaJjpsEu63FSUx7" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.7-1.6 1.5V12H17l-.5 3h-2.3v7A10 10 0 0 0 22 12" />
              </svg>
            </a>

            {/* YouTube */}
            <a href="https://www.youtube.com/@dav_wav" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.2s-.2-1.7-.8-2.4c-.8-.9-1.7-.9-2.1-1C17.7 2.5 12 2.5 12 2.5h0s-5.7 0-8.6.3c-.4.1-1.3.1-2.1 1-.6.7-.8 2.4-.8 2.4S0 8.1 0 10v2c0 1.9.2 3.8.2 3.8s.2 1.7.8 2.4c.8.9 1.9.9 2.4 1 1.7.2 7.1.3 8.6.3s5.7 0 8.6-.3c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.4.8-2.4s.2-1.9.2-3.8v-2c0-1.9-.2-3.8-.2-3.8zM9.6 14.8V7.8l6.4 3.5-6.4 3.5z" />
              </svg>
            </a>

            {/* Bandcamp */}
            <a href="https://davisransdellcaruso.bandcamp.com/" target="_blank" rel="noopener noreferrer" aria-label="Bandcamp">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
                <path d="M21 194L112 62c2.3-3.4 6.1-5.4 10.2-5.4H235c6.4 0 10.2 7.2 6.6 12.4L150 201c-2.3 3.4-6.1 5.4-10.2 5.4H27.6C21.2 206.4 17.4 199.2 21 194z" />
              </svg>
            </a>

            {/* Venmo */}
            <a href="https://venmo.com/davislikesmoney" target="_blank" rel="noopener noreferrer" aria-label="Venmo">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 2c.6 1 .9 2.1.9 3.5 0 4.3-3.7 9.9-6.7 13.8H7.2L4.5 2.6l5.9-.6 1.4 11.1c1.3-2.2 2.9-5.6 2.9-8 0-1.3-.2-2.2-.6-2.9L19.5 2z" />
              </svg>
            </a>
          </div>

          <form onSubmit={handleEmailSubmit} className="email-form">
            <input
              type="email"
              placeholder="your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="your city"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            {locationDetected && location !== locationDetected && (
              <p className="city-hint">Detected: {locationDetected} — correct above if needed.</p>
            )}
            <button type="submit" className="join-button">
              Join the List
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>

        {/* FOOTER */}
        <footer className="site-footer">
          <div className="footer-rule">
            <span className="rule-line" />
            <span className="rule-diamond small">◆</span>
            <span className="rule-line" />
          </div>
          <p className="disclaimer">
            © {new Date().getFullYear()} Davis Caruso. All rights reserved.
            Music, lyrics, artwork, and images may not be used to train
            artificial intelligence or machine learning models without explicit
            written permission.
          </p>
        </footer>
      </div>

      {/* ─── GLOBAL: grain + border ─────────────────────────────────── */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          background: #1a1410;
        }

        /* Grain texture */
        .grain-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.045;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 300px 300px;
        }

        /* Animated gold/periwinkle border */
        @keyframes borderDrift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .gradient-border-frame {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
        }

        .gradient-border-frame::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 8px;
          background: linear-gradient(
            135deg,
            #c9a24d,
            #6b6fa8,
            #8a8dc0,
            #e6e3dc44,
            #c9a24d,
            #7b7fc4,
            #c9a24d
          );
          background-size: 300% 300%;
          animation: borderDrift 14s ease infinite;
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        @media (prefers-reduced-motion: reduce) {
          .gradient-border-frame::before { animation: none; }
          .stage-glow { animation: none !important; }
          .album-card:hover .vinyl { animation: none !important; }
        }
      `}</style>

      {/* ─── SCOPED STYLES ──────────────────────────────────────────── */}
      <style jsx>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Page shell ── */
        .gallery-page {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          padding: 0 2rem 0;
          background: transparent;
          font-family: "Trocchi", serif;
          opacity: 0;
          transition: opacity 1.4s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-x: hidden;
          color: #e6e3dc;
        }
        .gallery-page.fade-in { opacity: 1; }

        /* ── Stage glow ── */
        @keyframes glowPulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50%       { opacity: 0.28; transform: scale(1.04); }
        }

        .stage-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 500px;
          background: radial-gradient(
            ellipse at 50% 30%,
            rgba(201, 162, 77, 0.22) 0%,
            rgba(123, 127, 196, 0.10) 45%,
            transparent 70%
          );
          pointer-events: none;
          animation: glowPulse 8s ease-in-out infinite;
        }

        /* ── Title ── */
        .title-block {
          position: relative;
          z-index: 1;
          text-align: center;
          margin-bottom: 4rem;
        }

        .eyebrow {
          font-size: 0.72rem;
          letter-spacing: 0.35em;
          color: #9b8ec4;
          text-transform: uppercase;
          margin: 0 0 1.1rem;
        }

        .brand-title {
          font-size: clamp(3.2rem, 8vw, 5.5rem);
          letter-spacing: 0.28em;
          color: #e6e3dc;
          margin: 0;
          line-height: 1;
          font-weight: 400;
        }

        .title-i {
          color: #c9a24d;
          font-style: italic;
        }

        /* ── Diamond rule ── */
        .title-rule {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          margin: 1.6rem auto 0;
          width: 180px;
        }

        .rule-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, #c9a24d88, transparent);
        }

        .rule-diamond {
          color: #c9a24d;
          font-size: 0.7rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .rule-diamond.small { font-size: 0.5rem; }

        /* ── Section rule ── */
        .section-rule {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          max-width: 600px;
          margin: 4.5rem auto 4.5rem;
        }

        /* ── Ticket ── */
        .ticket-link-wrapper {
          margin-bottom: 3.5rem;
          position: relative;
          z-index: 1;
        }

        .ticket-link {
          display: inline-block;
          text-decoration: none;
          border: 1px solid #c9a24d55;
          border-radius: 3px;
          padding: 1rem 1.8rem;
          transition: border-color 0.3s ease, background 0.3s ease;
          background: rgba(201, 162, 77, 0.05);
        }

        .ticket-link:hover {
          border-color: #c9a24d;
          background: rgba(201, 162, 77, 0.10);
        }

        .ticket-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
        }

        .ticket-venue {
          font-size: 0.68rem;
          letter-spacing: 0.28em;
          color: #9b8ec4;
          text-transform: uppercase;
        }

        .ticket-cta {
          font-size: 1.05rem;
          letter-spacing: 0.08em;
          color: #c9a24d;
        }

        /* ── Video ── */
        .video-outer {
          width: 100%;
          max-width: 860px;
          padding: 6px;
          background: linear-gradient(135deg, #c9a24d33, #7b7fc422, #c9a24d33);
          border-radius: 5px;
          margin-bottom: 0;
        }

        .video-wrapper {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 3px;
          overflow: hidden;
          background: #0d0b09;
        }

        .video-wrapper iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        /* ── Albums ── */
        .album-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 3.5rem 2.5rem;
          justify-content: center;
          max-width: 960px;
          width: 100%;
        }

        .album-card {
          text-align: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        /* ── Vinyl ── */
        .vinyl {
          width: min(300px, 80vw);
          height: min(300px, 80vw);
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%, #1c1c1c 0%, #0d0d0d 100%);
          box-shadow:
            0 0 0 1px rgba(201,162,77,0.12),
            0 8px 40px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.04);
          position: relative;
          margin: 0 auto;
          transition: box-shadow 0.4s ease;
        }

        .album-card:hover .vinyl {
          animation: spin 16s linear infinite;
          box-shadow:
            0 0 0 1px rgba(201,162,77,0.28),
            0 12px 50px rgba(0,0,0,0.8),
            0 0 30px rgba(201,162,77,0.08),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* Groove rings rendered as repeating radial */
        .groove-rings {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: repeating-radial-gradient(
            circle at 50% 50%,
            transparent 0px,
            transparent 4px,
            rgba(255,255,255,0.018) 4px,
            rgba(255,255,255,0.018) 5px
          );
          pointer-events: none;
        }

        .vinyl-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(112px, 28vw);
          height: min(112px, 28vw);
          border-radius: 50%;
          overflow: hidden;
          background: #000;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.06);
        }

        .vinyl-label {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
          display: block;
          background: #000;
          position: relative;
          z-index: 1;
        }

        .vinyl-sheen {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle at 32% 28%,
            rgba(255,255,255,0.07) 0%,
            transparent 55%
          );
          z-index: 2;
          pointer-events: none;
        }

        .center-hole {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #050505;
          box-shadow: 0 0 0 1.5px rgba(255,255,255,0.07);
          z-index: 3;
          pointer-events: none;
        }

        .album-title {
          margin-top: 1.1rem;
          color: #e6e3dc;
          font-size: 0.95rem;
          letter-spacing: 0.08em;
          line-height: 1.3;
          padding: 0 0.5rem;
          font-weight: 400;
        }

        .album-year {
          color: #9b8ec4;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          margin-top: 0.2rem;
        }

        /* ── Support / Social ── */
        .support-section {
          text-align: center;
          width: 100%;
          max-width: 640px;
          margin-top: 1rem;
        }

        .support-title {
          font-size: 0.75rem;
          letter-spacing: 0.32em;
          color: #9b8ec4;
          text-transform: uppercase;
          margin: 0 0 2.5rem;
        }

        .social-icons {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1.6rem;
          margin-bottom: 3rem;
          color: #c9a24d;
        }

        .social-icons a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          color: #c9a24d;
          opacity: 0.8;
          transition: opacity 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .social-icons a:hover { opacity: 1; }

        /* ── Email form ── */
        .email-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          width: 100%;
        }

        .email-form input {
          width: 100%;
          max-width: 340px;
          border: none;
          border-bottom: 1px solid #c9a24d44;
          background: none;
          color: #e6e3dc;
          padding: 0.7rem 0.2rem;
          text-align: center;
          font-size: 0.9rem;
          font-family: "Trocchi", serif;
          letter-spacing: 0.06em;
          outline: none;
          transition: border-color 0.25s ease;
          border-radius: 0;
          -webkit-appearance: none;
          appearance: none;
        }

        .email-form input:focus {
          border-bottom-color: #c9a24d;
        }

        .email-form input::placeholder {
          color: #6b6760;
          font-size: 0.82rem;
          letter-spacing: 0.14em;
        }

        .city-hint {
          font-size: 0.7rem;
          color: #7b7fc4;
          letter-spacing: 0.06em;
          margin: 0;
        }

        .join-button {
          margin-top: 0.5rem;
          border: 1px solid #c9a24d55;
          background: none;
          color: #c9a24d;
          padding: 0.7rem 2.2rem;
          cursor: pointer;
          letter-spacing: 0.22em;
          font-family: "Trocchi", serif;
          font-size: 0.72rem;
          text-transform: uppercase;
          border-radius: 2px;
          transition: border-color 0.25s ease, background 0.25s ease;
          -webkit-appearance: none;
          appearance: none;
          -webkit-tap-highlight-color: transparent;
        }

        .join-button:hover {
          border-color: #c9a24d;
          background: rgba(201, 162, 77, 0.08);
        }

        .message {
          margin-top: 1.25rem;
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          color: #9b8ec4;
        }

        /* ── Footer ── */
        .site-footer {
          width: 100%;
          max-width: 600px;
          margin-top: 5rem;
          padding-bottom: 3rem;
          text-align: center;
        }

        .footer-rule {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .disclaimer {
          color: #4a4840;
          font-size: 0.66rem;
          letter-spacing: 0.06em;
          line-height: 1.8;
          margin: 0;
        }

        /* ── Mobile ── */
        @media (max-width: 480px) {
          .gallery-page { padding: 0 1.25rem; }
          .brand-title { letter-spacing: 0.20em; }
          .stage-glow { width: 100vw; }
          .album-grid {
            gap: 2.5rem;
            grid-template-columns: 1fr;
          }
          .ticket-cta { font-size: 0.95rem; }
          .video-outer { padding: 4px; }
          .section-rule { margin: 3rem auto; }
        }
      `}</style>
    </>
  );
}