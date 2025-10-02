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
        <h1 className="brand-title">wavis</h1>
        <div className="underline"></div>
        <p className="tagline">art &amp; story</p>
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
          <Link href="/forgot-password">Forgot password?</Link>
        </div>

        {error && <p className="error">{error}</p>}
      </form>

      <style jsx>{`
        /* Inspired by album artwork tones */
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

        /* Glow behind "wavis" */
        .glow-behind {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -65%);
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 180, 120, 0.6) 0%, rgba(255, 140, 100, 0.3) 40%, transparent 70%);
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
      `}</style>
    </div>
  );
}
