// pages/welcome.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Welcome() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const handleAuth = async (
    e: React.FormEvent,
    destination: "gallery" | "lessons"
  ) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error && error.message.includes("Invalid login credentials")) {
        const signupRes = await supabase.auth.signUp({ email, password });
        if (signupRes.error) throw signupRes.error;

        setMessage("Please check your email to confirm your account.");
        setUnconfirmedEmail(email);
        setLoading(false);
        return;
      }

      if (error) throw error;

      if (data.user?.email_confirmed_at) {
        if (!stayLoggedIn && data.session) {
          localStorage.removeItem("supabase.auth.token");
          sessionStorage.setItem(
            "supabase.auth.token",
            JSON.stringify(data.session)
          );
        }
        router.push(`/${destination}`);
      } else {
        setMessage("Please confirm your email before accessing the gallery.");
        setUnconfirmedEmail(email);
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unconfirmedEmail) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
    });
    if (error) setError(error.message);
    else setMessage("Confirmation email resent. Please check your inbox.");
  };

  const credentialsFilled = email.trim() !== "" && password.trim() !== "";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#4b2a6f",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Clouds & mist for dream effect */}
      <div className="clouds"></div>
      <div className="mist"></div>

      <form
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "8px",
          padding: "2rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Header */}
        <h1
          style={{
            textAlign: "center",
            marginBottom: "2rem",
            color: "#4b2a6f",
            fontFamily: "Bodoni, serif",
            fontSize: "3rem",
            fontWeight: "bold",
          }}
        >
          dav.wav gallery
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            backgroundColor: "khaki",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            backgroundColor: "khaki",
          }}
        />

        <label
          style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}
        >
          <input
            type="checkbox"
            checked={stayLoggedIn}
            onChange={(e) => setStayLoggedIn(e.target.checked)}
            style={{ marginRight: "0.5rem" }}
          />
          Keep me logged in
        </label>

        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}
        {message && (
          <p style={{ color: "green", marginBottom: "1rem" }}>{message}</p>
        )}

        {unconfirmedEmail && (
          <button
            type="button"
            onClick={handleResend}
            className="dreamy-button"
            style={{ marginBottom: "1rem", width: "100%" }}
          >
            Resend Confirmation Email
          </button>
        )}

        {/* Music button */}
        <button
          type="submit"
          disabled={!credentialsFilled || loading}
          onClick={(e) => handleAuth(e, "gallery")}
          className="dreamy-button"
          style={{ width: "100%", marginBottom: "1rem" }}
        >
          {loading ? "Loading..." : "Music"}
        </button>

        {/* Learn button */}
        <button
          type="submit"
          disabled={!credentialsFilled || loading}
          onClick={(e) => handleAuth(e, "lessons")}
          className="dreamy-button"
          style={{ width: "100%", marginBottom: "1rem" }}
        >
          {loading ? "Loading..." : "Learn"}
        </button>

        {/* Store button */}
        <button
          type="button"
          onClick={() => window.open("/store", "_blank")}
          className="dreamy-button"
          style={{ width: "100%" }}
        >
          Store
        </button>
      </form>

      {/* Dreamy background + glow styles */}
      <style jsx>{`
        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.25rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }

        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.8);
        }

        .clouds {
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 100%;
          background: url("/clouds.png") repeat-x;
          background-size: cover;
          opacity: 0.25;
          animation: drift 60s linear infinite;
        }

        .mist {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0) 70%
          );
          pointer-events: none;
        }

        @keyframes drift {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
