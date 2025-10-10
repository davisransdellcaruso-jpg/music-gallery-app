// pages/welcome.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Welcome() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/gallery");
  };

  return (
    <div className="welcome-page">
      <div className="title-block">
        <div className="glow-behind"></div>
        <h1 className="brand-title">davis caruso</h1>
        <div className="underline"></div>
        <p className="tagline">creativity amplified</p>
      </div>

      <form onSubmit={handleLogin} className="login-box">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="options">
          <label>
            <input
              type="checkbox"
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
            />
            Stay logged in
          </label>
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "…" : "Login"}
        </button>

        <div className="links">
          <Link href="/signup">Create an account</Link>
          <Link href="/reset-password">Forgot password?</Link>
        </div>

        {error && <p className="error">{error}</p>}
      </form>

      {/* Gentle divider (matches the underline vibe) */}
      <hr className="soft-divider" />

      {/* --- Social + Support (no box) --- */}
      <section className="social-footer">
        <h2 className="footer-title">Stay connected</h2>

        <div className="links-icons">
          {/* Instagram */}
          <a
            className="social-icon"
            href="https://www.instagram.com/dav_wav_/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            title="Instagram"
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"
                fill="currentColor"
              />
            </svg>
          </a>

          {/* Facebook */}
          <a
            className="social-icon"
            href="https://www.facebook.com/DavisCarusoMusic/?rdid=nTaJjpsEu63FSUx7"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            title="Facebook"
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22 12a10 10 0 1 0-11.56 9.9v-7h-2.3V12h2.3V9.8c0-2.27 1.35-3.53 3.42-3.53.99 0 2.02.18 2.02.18v2.23h-1.14c-1.12 0-1.47.7-1.47 1.42V12h2.5l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z"
                fill="currentColor"
              />
            </svg>
          </a>

          {/* TikTok */}
          <a
            className="social-icon"
            href="https://www.tiktok.com/@dav_wav_?_t=ZT-90R8qRubZ2E&_r=1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            title="TikTok"
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 8.5a6.9 6.9 0 0 1-4.5-1.65V16a5.85 5.85 0 1 1-5.85-5.85c.36 0 .72.04 1.06.12v2.35a3.5 3.5 0 1 0 2.44 3.36V2h2.42a6.9 6.9 0 0 0 4.43 4.54V8.5z"
                fill="currentColor"
              />
            </svg>
          </a>
        </div>

        <p className="support">
          Need help? Email{" "}
          <a href="mailto:davisransdellcaruso@gmail.com" className="support-link">
            davisransdellcaruso@gmail.com
          </a>{" "}
          for tech support.
        </p>
      </section>

      <style jsx>{`
        /* Page */
        .welcome-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          background-size: cover;
          font-family: "Eurostile", "Futura", "Helvetica Neue", sans-serif;
          padding: 1rem;
          position: relative;
        }

        .title-block {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
        }

        /* Glow behind title */
        .glow-behind {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -65%);
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 180, 120, 0.6) 0%,
            rgba(255, 140, 100, 0.3) 40%,
            transparent 70%
          );
          filter: blur(60px);
          z-index: 0;
          animation: pulse 8s ease-in-out infinite alternate;
        }

        @keyframes pulse {
          from {
            transform: translate(-50%, -65%) scale(1);
            opacity: 0.7;
          }
          to {
            transform: translate(-50%, -65%) scale(1.15);
            opacity: 1;
          }
        }

        .brand-title {
          font-size: 4rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: "Eurostile", "Futura", "Helvetica Neue", sans-serif;
          position: relative;
          z-index: 1;
        }

        .underline {
          width: 120px;
          height: 3px;
          margin: 0.5rem auto 1rem;
          background: linear-gradient(to right, #ff6b4a, #ffb347);
          border-radius: 2px;
          z-index: 1;
          position: relative;
        }

        .tagline {
          font-style: italic;
          font-size: 1.3rem;
          color: #ddd;
          font-family: "Didot", "Bodoni MT", serif;
          position: relative;
          z-index: 1;
        }

        .login-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 320px;
          padding: 2rem;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(6px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
          z-index: 1;
        }

        .login-box input {
          width: 100%;
          margin-bottom: 1rem;
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
          font-family: "Futura", "Arial Narrow", sans-serif;
        }

        .login-box input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .options {
          align-self: flex-start;
          font-size: 0.9rem;
          color: #ddd;
          margin-bottom: 1rem;
        }

        .login-button {
          width: 100%;
          padding: 0.75rem;
          border-radius: 6px;
          border: none;
          font-size: 1rem;
          font-weight: bold;
          font-family: "Futura", "Arial Narrow", sans-serif;
          background: linear-gradient(135deg, #ff6b4a, #ffb347);
          color: #2a004f;
          cursor: pointer;
          margin-bottom: 1rem;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }

        .login-button:hover {
          background: linear-gradient(135deg, #ff8366, #ffc56d);
          box-shadow: 0 0 12px rgba(255, 190, 150, 0.7);
        }

        .links {
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }

        .links a {
          color: #ddd;
          text-decoration: underline;
          cursor: pointer;
        }

        .error {
          color: #ff7b7b;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }

        /* Gentle divider matching the brand underline vibe */
        .soft-divider {
          width: min(960px, 92vw);
          margin: 2.25rem auto 1.25rem;
          border: none;
          height: 2px;
          background: linear-gradient(to right, #ff6b4a, #ffb347);
          opacity: 0.55; /* softer than the title underline */
          border-radius: 2px;
        }

        /* Social (no box) */
        .social-footer {
          margin-top: 0.25rem;
        }

        .footer-title {
          margin: 0 0 0.75rem 0;
          text-align: center;
          font-family: Bodoni, serif;
          font-size: 1.9rem;
          letter-spacing: 0.5px;
        }

        /* Icon links (compact, circular) */
        .links-icons {
          display: flex;
          justify-content: center;
          gap: 0.9rem;
          margin-bottom: 0.6rem;
        }
        .social-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #111;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.3s ease, background 0.25s ease;
          box-shadow: 0 0 0 rgba(175, 184, 254, 0);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .social-icon:hover {
          background: #1a1a1a;
          box-shadow: 0 0 14px rgba(175, 184, 254, 0.55);
          transform: translateY(-1px) scale(1.03);
        }
        .icon {
          width: 22px;
          height: 22px;
          display: block;
        }

        .support {
          color: #eae6ff;
          text-align: center;
          margin: 0.25rem 0 0;
          font-size: 0.98rem;
          opacity: 0.92;
        }
        .support-link {
          color: #fff;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .support-link:hover {
          text-decoration-thickness: 2px;
        }
      `}</style>
    </div>
  );
}
