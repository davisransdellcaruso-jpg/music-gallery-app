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
      if (error.code === "23505") setMessage("You're already signed up 💜");
      else setMessage("Error: " + error.message);
    } else {
      setMessage("Thanks for supporting 🌙");
      setEmail("");
    }
  };

  if (loading) return <div style={{ color: "white" }}>Loading albums…</div>;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
        rel="stylesheet"
      />
      <div className={`gallery-page ${fadeIn ? "fade-in" : ""}`}>
        {/* Top navigation */}
        <div className="nav-bar">
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => router.push("/store")} className="nav-button">
              Store 🛒
            </button>
            <button onClick={() => router.push("/learn")} className="nav-button">
              Learn 📖
            </button>
            <button onClick={() => router.push("/newsletter")} className="nav-button">
              Newsletter ✍️
            </button>
          </div>
        </div> {/* ✅ this closing div was missing */}

        {/* Title */}
        <div className="title-block">
          <div className="glow-behind"></div>
          <h1 className="brand-title">Davis Caruso</h1>
          <div className="underline"></div>
        </div>

        {/* Albums */}
        <div className="album-grid">
          {albums.map((album) => (
            <div
              key={album.id}
              className="album-card"
              onClick={() => router.push(`/album/${album.id}`)}
            >
              <div className="vinyl">
                <div className="vinyl-grooves"></div>
                <div className="vinyl-center">
                  <Image
                    src={album.cover_url}
                    alt={album.title}
                    width={130}
                    height={130}
                    className="vinyl-label"
                  />
                </div>
              </div>
              <h2 className="album-title">{album.title}</h2>
              <p className="album-year">({album.year})</p>
            </div>
          ))}
        </div>

        {/* Support section */}
        <div className="support-section">
          <h2 className="support-title">Easy ways to support 💜</h2>

          <div className="social-icons">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/dav_wav_/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#a78bfa" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.423.403a4.92 4.92 0 0 1 1.79 1.04 4.92 4.92 0 0 1 1.04 1.79c.163.453.349 1.253.403 2.423.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.423a4.92 4.92 0 0 1-1.04 1.79 4.92 4.92 0 0 1-1.79 1.04c-.453.163-1.253.349-2.423.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.423-.403a4.92 4.92 0 0 1-1.79-1.04 4.92 4.92 0 0 1-1.04-1.79c-.163-.453-.349-1.253-.403-2.423C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.423a4.92 4.92 0 0 1 1.04-1.79 4.92 4.92 0 0 1 1.79-1.04c.453-.163 1.253-.349 2.423-.403C8.416 2.175 8.796 2.163 12 2.163zM12 5.838A6.162 6.162 0 0 0 5.838 12 6.162 6.162 0 0 0 12 18.162 6.162 6.162 0 0 0 18.162 12 6.162 6.162 0 0 0 12 5.838zm0 10.162A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.406-11.845a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@dav_wav_?_t=ZT-90R8qRubZ2E&_r=1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256">
                <path fill="#a78bfa" d="M180.7 53.4c9.8 9.4 22.7 15.4 37.2 16.3v40.5c-13.3-.1-26.5-2.7-38.9-7.7v61.9c0 47.8-38.7 86.6-86.5 86.6-47.9 0-86.5-38.8-86.5-86.6 0-47.9 38.7-86.6 86.5-86.6 4.7 0 9.4.4 14 1.2v43.7c-4.5-1.4-9.2-2.1-14-2.1-24.3 0-44 19.8-44 44.1 0 24.3 19.8 44.1 44 44.1 24.2 0 44-19.8 44-44.1V12h43.7c.8 14.6 6.8 27.5 16.5 37.4z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/DavisCarusoMusic/?rdid=nTaJjpsEu63FSUx7"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#a78bfa" viewBox="0 0 24 24">
                <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.7-1.6 1.5V12H17l-.5 3h-2.3v7A10 10 0 0 0 22 12" />
              </svg>
            </a>
          </div>

          {/* Email signup */}
          <form onSubmit={handleEmailSubmit} className="email-form">
            <input
              type="email"
              placeholder="Enter your email to stay in touch"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="dreamy-button">Join Mailing List ✨</button>
          </form>

          {message && <p className="message">{message}</p>}

          <p className="support-text">
            email{" "}
            <a href="mailto:davisransdellcaruso@gmail.com">
              davisransdellcaruso@gmail.com
            </a>{" "}
            for tech support
          </p>
        </div>
      </div>

      <style jsx>{`
        .gallery-page {
          opacity: 0;
          transition: opacity 1s ease;
        }
        .gallery-page.fade-in {
          opacity: 1;
        }
        .gallery-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          font-family: "Trocchi", serif;
        }

        .nav-bar {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          margin-bottom: 2rem;
        }
        .nav-button {
          font-family: "Trocchi", serif;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          padding: 0.5rem 1rem;
          color: #fff;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .nav-button:hover {
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
        }

        .title-block {
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
        }
        .brand-title {
          font-size: 3.5rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .underline {
          width: 120px;
          height: 3px;
          margin: 0.5rem auto 1rem;
          background: linear-gradient(to right, #ff6b4a, #ffb347);
          border-radius: 2px;
        }

        .album-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(375px, 1fr));
          gap: 3rem;
          max-width: 900px;
          width: 100%;
          justify-items: center;
        }

        .vinyl {
          position: relative;
          width: 375px;
          height: 375px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #111 0%, #000 100%);
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
          transition: transform 0.5s ease;
        }

        .vinyl-grooves {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: repeating-radial-gradient(
            circle,
            rgba(255, 255, 255, 0.15) 0px,
            rgba(255, 255, 255, 0.15) 1px,
            transparent 2px,
            transparent 3px
          );
          opacity: 0.7;
        }

        .vinyl-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          overflow: hidden;
          width: 130px;
          height: 130px;
          border: 2px solid #222;
          z-index: 2;
        }

        .album-card:hover .vinyl {
          animation: spin 12s linear infinite;
          transform: scale(1.05);
        }

        @keyframes spin {
          from {
            transform: rotate(0deg) scale(1.05);
          }
          to {
            transform: rotate(360deg) scale(1.05);
          }
        }

        .album-title {
          color: white;
          margin-top: 0.75rem;
        }
        .album-year {
          color: #ddd;
          margin-top: 0.25rem;
        }

        .support-section {
          text-align: center;
          margin-top: 4rem;
          color: #d1c4e9;
        }
        .support-title {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #ffffff;
        }
        .social-icons {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .social-icons svg {
          transition: transform 0.3s ease, fill 0.3s ease;
        }
        .social-icons a:hover svg {
          fill: #c4b5fd;
          transform: scale(1.2);
          filter: drop-shadow(0 0 6px rgba(167, 139, 250, 0.8));
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
          padding: 0.8rem 1rem;
          border-radius: 8px;
          border: 1px solid #a78bfa;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          text-align: center;
          font-size: 1rem;
          transition: box-shadow 0.3s ease;
        }
        .email-form input:focus {
          outline: none;
          box-shadow: 0 0 15px rgba(167, 139, 250, 0.7);
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 8px;
          padding: 0.6rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
          font-family: "Trocchi", serif;
          font-weight: bold;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.8);
        }

        .message {
          color: #c4b5fd;
          margin-top: 0.5rem;
        }

        .support-text {
          font-size: 0.9rem;
          color: #bcaef5;
          margin-top: 1.5rem;
        }
        .support-text a {
          color: #a78bfa;
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
