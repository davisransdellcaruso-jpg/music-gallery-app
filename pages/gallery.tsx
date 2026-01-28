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
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!email) return setMessage("Please enter your email.");

    const { error } = await supabase.from("mailing_list").insert([{ email }]);

    if (error) {
      if ((error as any).code === "23505") {
        setMessage("You're already signed up …");
      } else {
        setMessage("Error: " + error.message);
      }
    } else {
      setMessage("Thanks for supporting …");
      setEmail("");
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
            <span>STUCCHi</span>
          </h1>
          <div className="underline" />
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
                <div className="vinyl-center">
                  <Image
                    src={album.cover_url}
                    alt={album.title}
                    width={120}
                    height={120}
                  />
                </div>
              </div>

              <h2 className="album-title">{album.title}</h2>
              <p className="album-year">({album.year})</p>
            </div>
          ))}
        </div>

        {/* SUPPORT */}
        <div className="support-section">
          <h2 className="support-title">Easy ways to support</h2>

          <div className="social-icons">
            {/* Instagram (stroke) */}
            <a
              href="https://www.instagram.com/dav_wav_/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c9a24d"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" />
              </svg>
            </a>

            {/* TikTok (fill) */}
            <a
              href="https://www.tiktok.com/@dav_wav_?_t=ZT-90R8qRubZ2E&_r=1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 256 256"
                fill="#c9a24d"
              >
                <path d="M180.7 53.4c9.8 9.4 22.7 15.4 37.2 16.3v40.5c-13.3-.1-26.5-2.7-38.9-7.7v61.9c0 47.8-38.7 86.6-86.5 86.6-47.9 0-86.5-38.8-86.5-86.6 0-47.9 38.7-86.6 86.5-86.6 4.7 0 9.4.4 14 1.2v43.7c-4.5-1.4-9.2-2.1-14-2.1-24.3 0-44 19.8-44 44.1 0 24.3 19.8 44.1 44 44.1 24.2 0 44-19.8 44-44.1V12h43.7c.8 14.6 6.8 27.5 16.5 37.4z" />
              </svg>
            </a>

            {/* Facebook (fill) */}
            <a
              href="https://www.facebook.com/DavisCarusoMusic/?rdid=nTaJjpsEu63FSUx7"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="#c9a24d"
              >
                <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.7-1.6 1.5V12H17l-.5 3h-2.3v7A10 10 0 0 0 22 12" />
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
            <button type="submit" className="dreamy-button">
              Join Mailing List
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>
      </div>

      <style jsx>{`
        .gallery-page {
          min-height: 100vh;
          padding: 3rem 2rem;
          background: #3a2f4d;
          font-family: "Trocchi", serif;
          opacity: 0;
          transition: opacity 1.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
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

        .album-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, 300px);
          gap: 4rem;
          justify-content: center;
          max-width: 960px;
          width: 100%;
        }

        .album-card {
          width: 300px;
          text-align: center;
          cursor: pointer;
        }

        .vinyl {
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: #111;
          position: relative;
        }

        .album-card:hover .vinyl {
          animation: spin 14s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .vinyl-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
        }

        .album-title {
          margin-top: 1rem;
          color: #e6e3dc;
          font-size: 1.1rem;
        }

        .album-year {
          color: #b6b1a7;
          font-size: 0.85rem;
        }

        .support-section {
          margin-top: 6rem;
          text-align: center;
          color: #b6b1a7;
        }

        .support-title {
          color: #e6e3dc;
          margin-bottom: 2rem;
        }

        .social-icons {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 3rem;
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
        }

        .email-form input {
          width: 100%;
          max-width: 320px;
          border: 1px solid #b6b1a7;
          background: none;
          color: #e6e3dc;
          padding: 0.7rem 1rem;
          text-align: center;
        }

        .dreamy-button {
          border: 1px solid #c9a24d;
          background: none;
          color: #c9a24d;
          padding: 0.6rem 1.4rem;
          cursor: pointer;
          letter-spacing: 0.1em;
        }

        .message {
          margin-top: 1rem;
          color: #e6e3dc;
        }
      `}</style>
    </>
  );
}
