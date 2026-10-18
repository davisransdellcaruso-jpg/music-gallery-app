// pages/signup.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import { useLang, type Lang } from "../components/i18n";

const en = {
  title: "Create Account",
  fullName: "Full Name",
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm Password",
  mismatch: "Passwords do not match.",
  checkEmail: "Check your email to confirm your account before logging in.",
  unexpected: "An unexpected error occurred.",
  exists: "That email is already registered.",
  weak: "Your password needs at least 6 characters.",
  signUp: "Sign Up",
  creating: "Creating...",
};

type Copy = typeof en;

const es: Copy = {
  title: "Crear cuenta",
  fullName: "Nombre completo",
  email: "Correo electrónico",
  password: "Contraseña",
  confirmPassword: "Confirmar contraseña",
  mismatch: "Las contraseñas no coinciden.",
  checkEmail:
    "Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.",
  unexpected: "Ocurrió un error inesperado.",
  exists: "Ese correo ya está registrado.",
  weak: "Tu contraseña debe tener al menos 6 caracteres.",
  signUp: "Registrarme",
  creating: "Creando...",
};

const COPY: Record<Lang, Copy> = { en, es };

// Supabase error messages are in English, so map the common ones.
function friendlyError(msg: string, c: Copy, lang: Lang): string {
  const m = (msg || "").toLowerCase();
  if (m.includes("already registered")) return c.exists;
  if (m.includes("at least") && m.includes("character")) return c.weak;
  return lang === "es" ? c.unexpected : msg || c.unexpected;
}

export default function Signup() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const c = COPY[lang];

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError(c.mismatch);
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // full name + language saved on the user (lang lets you send
          // Spanish emails later)
          data: { full_name: fullName, lang },
          // Where the "confirm your email" link lands: the map step.
          // This URL must be allowed in Supabase (see notes).
          emailRedirectTo: `${window.location.origin}/welcome-map?lang=${lang}`,
        },
      });

      if (signUpError) throw signUpError;

      // If email confirmation is required, no session is returned yet
      if (!data.session) {
        setMessage(c.checkEmail);
      } else {
        // Already signed in: straight to the map, which leads on to /story
        router.push("/welcome-map");
      }
    } catch (err: any) {
      setError(friendlyError(err?.message, c, lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* glow layers */}
      <div className="glow glow1" />
      <div className="glow glow2" />

      {/* clouds + mist */}
      <div className="clouds"></div>
      <div className="mist"></div>

      {/* language toggle */}
      <div className="lang-toggle">
        {(["en", "es"] as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={lang === l ? "lang-btn active" : "lang-btn"}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleSignup} className="signup-form">
        <h1 className="signup-title">{c.title}</h1>

        <input
          type="text"
          placeholder={c.fullName}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="signup-input"
        />

        <input
          type="email"
          placeholder={c.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="signup-input"
        />

        <input
          type="password"
          placeholder={c.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="signup-input"
        />

        <input
          type="password"
          placeholder={c.confirmPassword}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="signup-input"
        />

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button type="submit" disabled={loading} className="dreamy-button">
          {loading ? c.creating : c.signUp}
        </button>
      </form>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            #2a004f 0%,
            #4b2a6f 50%,
            #2e1a47 100%
          );
        }

        .signup-form {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 2rem;
          position: relative;
          z-index: 2;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .signup-title {
          text-align: center;
          margin-bottom: 2rem;
          color: #4b2a6f;
          font-family: Bodoni, serif;
          font-size: 2rem;
          font-weight: bold;
        }

        .signup-input {
          width: 100%;
          padding: 0.75rem;
          margin-bottom: 1rem;
          border-radius: 6px;
          border: 1px solid #ccc;
          background-color: khaki;
        }

        .error {
          color: red;
          margin-bottom: 1rem;
          text-align: center;
        }

        .success {
          color: green;
          margin-bottom: 1rem;
          text-align: center;
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.25rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          width: 100%;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.8);
        }

        /* language toggle */
        .lang-toggle {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 3;
          display: flex;
          gap: 6px;
        }
        .lang-btn {
          padding: 5px 10px;
          border-radius: 8px;
          border: 1px solid rgba(174, 184, 254, 0.7);
          background: rgba(42, 0, 79, 0.6);
          color: #e6e9ff;
          font-size: 0.8rem;
          font-weight: bold;
          cursor: pointer;
        }
        .lang-btn.active {
          background: #aeb8fe;
          color: #2a004f;
        }

        /* glow */
        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.5;
          animation: pulse 12s ease-in-out infinite alternate;
        }
        .glow1 {
          width: 600px;
          height: 600px;
          top: -200px;
          left: -200px;
          background: rgba(168, 85, 247, 0.6);
        }
        .glow2 {
          width: 500px;
          height: 500px;
          bottom: -150px;
          right: -150px;
          background: rgba(99, 102, 241, 0.6);
          animation-delay: 6s;
        }
        @keyframes pulse {
          from {
            transform: scale(1);
            opacity: 0.4;
          }
          to {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }

        /* clouds + mist */
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