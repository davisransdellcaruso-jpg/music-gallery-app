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
  const [city, setCity] = useState("");
  const [cityDetected, setCityDetected] = useState("");
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

    // Auto-detect city from IP
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const detected = data.city || "";
        setCityDetected(detected);
        setCity(detected);
      })
      .catch(() => {});
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!email) return setMessage("Please enter your email.");

    const { error } = await supabase.from("mailing_list").insert([{
      email,
      city: city || cityDetected || null,
      city_detected: cityDetected || null,
    }]);

    if (error) {
      if ((error as any).code === "23505") {
        setMessage("You're already signed up …");
      } else {
        setMessage("Error: " + error.message);
      }
    } else {
      setMessage("Thanks for supporting …");
      setEmail("");
      setCity("");
      setCityDetected("");
    }
  };

  if (loading) return <div style={{ color: "#e6e3dc" }}>Loading albums…</div>;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
        rel="stylesheet"
      />

      <div className={`gallery-page ${fadeIn ? "fade-in" : ""}`}>
        <div style={{ height: "2rem" }} />

        {/* TITLE */}
        <div className="title-block">
          <h1 className="brand-title">
            <span>DAViS</span>
            <span className="gold-ellipsis">…</span>
          </h1>
          <div className="underline" />
        </div>

        {/* FEATURED VIDEO */}
        <div className="video-wrapper">
          <iframe
            src="https://www.youtube.com/embed/dSE6G5vTX40"
            title="DAViS featured video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="section-divider" />

        {/* ALBUMS */}
        <div className="album-grid">
          {albums.map((album) => (
            <div
              key={album.id}
              className="album-card"
              onClick={() => router.push(`/album/${album.id}`)}
            >
              <div className="vinyl">
                <div className="vinyl-center">
                  <Image
                    src={album.cover_url}
                    alt={album.title}
                    width={120}
                    height={120}
                    className="vinyl-label"
                  />
                  <div className="center-hole" />
                </div>
              </div>

              <h2 className="album-title">{album.title}</h2>
              <p className="album-year">({album.year})</p>
            </div>
          ))}
        </div>

        {/* SUPPORT */}
        <div className="support-section">
          <h2 className="support-title">see you soon...</h2>

          <div className="social-icons">
            {/* Instagram */}
            <a href="https://www.instagram.com/dav_wav_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a24d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" />
              </svg>
            </a>

            {/* TikTok */}
            <a href="https://www.tiktok.com/@dav_wav_?_t=ZT-90R8qRubZ2E&_r=1" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="#c9a24d">
                <path d="M180.7 53.4c9.8 9.4 22.7 15.4 37.2 16.3v40.5c-13.3-.1-26.5-2.7-38.9-7.7v61.9c0 47.8-38.7 86.6-86.5 86.6-47.9 0-86.5-38.8-86.5-86.6 0-47.9 38.7-86.6 86.5-86.6 4.7 0 9.4.4 14 1.2v43.7c-4.5-1.4-9.2-2.1-14-2.1-24.3 0-44 19.8-44 44.1 0 24.3 19.8 44.1 44 44.1 24.2 0 44-19.8 44-44.1V12h43.7c.8 14.6 6.8 27.5 16.5 37.4z" />
              </svg>
            </a>

            {/* Facebook */}
            <a href="https://www.facebook.com/DavisCarusoMusic/?rdid=nTaJjpsEu63FSUx7" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#c9a24d">
                <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.7-1.6 1.5V12H17l-.5 3h-2.3v7A10 10 0 0 0 22 12" />
              </svg>
            </a>

            {/* YouTube */}
            <a href="https://www.youtube.com/@dav_wav" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#c9a24d">
                <path d="M23.5 6.2s-.2-1.7-.8-2.4c-.8-.9-1.7-.9-2.1-1C17.7 2.5 12 2.5 12 2.5h0s-5.7 0-8.6.3c-.4.1-1.3.1-2.1 1-.6.7-.8 2.4-.8 2.4S0 8.1 0 10v2c0 1.9.2 3.8.2 3.8s.2 1.7.8 2.4c.8.9 1.9.9 2.4 1 1.7.2 7.1.3 8.6.3s5.7 0 8.6-.3c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.4.8-2.4s.2-1.9.2-3.8v-2c0-1.9-.2-3.8-.2-3.8zM9.6 14.8V7.8l6.4 3.5-6.4 3.5z" />
              </svg>
            </a>

            {/* Bandcamp */}
            <a href="https://davisransdellcaruso.bandcamp.com/?search_item_id%3D582533888%26search_item_type%3Db%26search_match_part%3D%253F%26search_page_id%3D5074082088%26search_page_no%3D0%26search_rank%3D1=" target="_blank" rel="noopener noreferrer" aria-label="Bandcamp">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="#c9a24d">
                <path d="M21 194L112 62c2.3-3.4 6.1-5.4 10.2-5.4H235c6.4 0 10.2 7.2 6.6 12.4L150 201c-2.3 3.4-6.1 5.4-10.2 5.4H27.6C21.2 206.4 17.4 199.2 21 194z" />
              </svg>
            </a>

            {/* Venmo */}
            <a href="https://venmo.com/davislikesmoney" target="_blank" rel="noopener noreferrer" aria-label="Venmo">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#c9a24d">
                <path d="M19.5 2c.6 1 .9 2.1.9 3.5 0 4.3-3.7 9.9-6.7 13.8H7.2L4.5 2.6l5.9-.6 1.4 11.1c1.3-2.2 2.9-5.6 2.9-8 0-1.3-.2-2.2-.6-2.9L19.5 2z" />
              </svg>
            </a>
          </div>

          <form onSubmit={handleEmailSubmit} className="email-form">
            <input
              type="email"
              placeholder="Enter your email to stay in touch"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="city-input"
            />
            {cityDetected && city !== cityDetected && (
              <p className="city-hint">We detected {cityDetected} — feel free to correct it above.</p>
            )}
            <button type="submit" className="dreamy-button">
              Join Mailing List
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>

        {/* DISCLAIMER */}
        <p className="disclaimer">
          © {new Date().getFullYear()} Davis Caruso. All rights reserved. This website and all its content — including music, lyrics, artwork, and images — may not be used to train artificial intelligence or machine learning models without explicit written permission.
        </p>
      </div>

      <style jsx>{`
        *, *::before, *::after {
          box-sizing: border-box;
        }

        .gallery-page {
          min-height: 100vh;
          padding: 3rem 2rem;
          background: #7b7fc4;
          font-family: "Trocchi", serif;
          opacity: 0;
          transition: opacity 1.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-x: hidden;
        }
        .gallery-page.fade-in {
          opacity: 1;
        }

        .title-block {
          text-align: center;
          margin-bottom: 5rem;
        }

        .brand-title {
          font-size: 3rem;
          letter-spacing: 0.22em;
          color: #e6e3dc;
          display: inline-flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          justify-content: center;
          text-transform: none;
          -webkit-text-size-adjust: 100%;
        }

        .gold-ellipsis {
          color: #c9a24d;
        }

        .underline {
          width: 60px;
          height: 1px;
          margin: 1.5rem auto 0;
          background: #c9a24d;
        }

        .video-wrapper {
          width: 100%;
          max-width: 900px;
          margin-bottom: 5rem;
          aspect-ratio: 16 / 9;
          border-radius: 6px;
          overflow: hidden;
        }

        .video-wrapper iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        .section-divider {
          width: 60px;
          height: 1px;
          background: #c9a24d;
          margin: 0 auto 5rem;
        }

        .album-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 3rem;
          justify-content: center;
          max-width: 960px;
          width: 100%;
        }

        .album-card {
          width: 100%;
          max-width: 320px;
          text-align: center;
          cursor: pointer;
          margin: 0 auto;
          -webkit-tap-highlight-color: transparent;
        }

        .vinyl {
          width: min(320px, 82vw);
          height: min(320px, 82vw);
          border-radius: 50%;
          background: #111;
          position: relative;
          margin: 0 auto;
        }

        .album-card:hover .vinyl {
          animation: spin 14s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .vinyl-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(120px, 30vw);
          height: min(120px, 30vw);
          border-radius: 50%;
          overflow: hidden;
          background: #000;
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
          filter: contrast(1.02) saturate(1.02);
        }

        .vinyl-center::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background:
            radial-gradient(circle at 30% 25%, rgba(255,255,255,0.06), transparent 55%),
            radial-gradient(circle at 70% 70%, rgba(0,0,0,0.10), transparent 60%),
            repeating-linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.018) 0px,
              rgba(255, 255, 255, 0.018) 2px,
              transparent 2px,
              transparent 6px
            );
          mix-blend-mode: overlay;
          opacity: 0.35;
          pointer-events: none;
          z-index: 2;
        }

        .center-hole {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,1) 100%);
          box-shadow:
            0 0 0 2px rgba(255,255,255,0.06),
            inset 0 1px 2px rgba(255,255,255,0.08);
          opacity: 0.55;
          z-index: 3;
          pointer-events: none;
        }

        .album-title {
          margin-top: 1rem;
          color: #e6e3dc;
          font-size: 1.05rem;
          line-height: 1.25;
          padding: 0 0.25rem;
        }

        .album-year {
          color: #d4d1eb;
          font-size: 0.85rem;
        }

        .support-section {
          margin-top: 5rem;
          text-align: center;
          color: #d4d1eb;
          width: 100%;
          max-width: 720px;
        }

        .support-title {
          color: #e6e3dc;
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
          letter-spacing: 0.08em;
        }

        .social-icons {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1.25rem;
          margin-bottom: 2.25rem;
        }

        .social-icons a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          -webkit-tap-highlight-color: transparent;
        }

        .social-icons svg {
          transition: opacity 0.2s ease;
        }

        .social-icons a:hover svg {
          opacity: 0.7;
        }

        .email-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
        }

        .email-form input {
          width: 100%;
          max-width: 360px;
          border: 1px solid #d4d1eb;
          background: none;
          color: #e6e3dc;
          padding: 0.75rem 1rem;
          text-align: center;
          border-radius: 10px;
          font-size: 16px;
          font-family: "Trocchi", serif;
          -webkit-appearance: none;
          appearance: none;
        }

        .email-form input::placeholder {
          color: #a8a6c8;
        }

        .city-hint {
          font-size: 0.75rem;
          color: #a8a6c8;
          margin: 0;
        }

        .dreamy-button {
          border: 1px solid #c9a24d;
          background: none;
          color: #c9a24d;
          padding: 0.7rem 1.4rem;
          cursor: pointer;
          letter-spacing: 0.1em;
          font-family: "Trocchi", serif;
          font-size: 16px;
          border-radius: 10px;
          width: 100%;
          max-width: 360px;
          -webkit-appearance: none;
          appearance: none;
          -webkit-tap-highlight-color: transparent;
        }

        .message {
          margin-top: 1rem;
          color: #e6e3dc;
        }

        .disclaimer {
          margin-top: 4rem;
          padding: 0 1rem 2rem;
          color: #a8a6c8;
          font-size: 0.72rem;
          text-align: center;
          max-width: 600px;
          line-height: 1.6;
          letter-spacing: 0.02em;
        }

        /* --- Mobile polish --- */
        @media (max-width: 480px) {
          .gallery-page {
            padding: 2.25rem 1.1rem;
          }

          .title-block {
            margin-bottom: 3.25rem;
          }

          .brand-title {
            font-size: 1.9rem;
            letter-spacing: 0.16em;
            gap: 0.5rem;
          }

          .underline {
            width: 54px;
            margin-top: 1.1rem;
          }

          .video-wrapper {
            margin-bottom: 3rem;
          }

          .section-divider {
            margin-bottom: 3rem;
          }

          .album-grid {
            gap: 2.25rem;
            grid-template-columns: 1fr;
          }

          .support-section {
            margin-top: 3.75rem;
          }

          .center-hole {
            width: 9px;
            height: 9px;
          }
        }
      `}</style>
    </>
  );
}