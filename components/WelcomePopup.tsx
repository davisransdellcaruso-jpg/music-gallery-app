// components/WelcomePopup.tsx
import { useEffect, useState } from "react";
import { useLang, type Lang } from "./i18n";

const STORAGE_KEY = "dc_welcome_seen";

const en = {
  title: "A song for you",
  copy: 'An unreleased song from my new album, "Periwinkle", is yours when you join.',
  placeholder: "your email",
  emailAria: "Your email",
  submit: "SEND ME THE SONG",
  fine: "Plus occasional news. Unsubscribe anytime.",
  doneTitle: "Check your inbox",
  doneBefore: "I just sent a confirmation link to ",
  doneAfter: ". Tap it and your song is waiting.",
  doneFine: "Nothing there? Check your spam or promotions folder.",
  close: "CLOSE",
  closeAria: "Close",
  errEmail: "Please enter a valid email.",
  errSend: "Couldn't send the email. Please try again.",
  errServer: "Something went wrong. Please try again.",
};

type Copy = typeof en;
type ErrKey = "errEmail" | "errSend" | "errServer";

const es: Copy = {
  title: "Una canción para ti",
  copy: 'Una canción inédita de mi nuevo álbum, "Periwinkle", es tuya al unirte.',
  placeholder: "tu correo electrónico",
  emailAria: "Tu correo electrónico",
  submit: "ENVÍAME LA CANCIÓN",
  fine: "Además, noticias de vez en cuando. Puedes darte de baja cuando quieras.",
  doneTitle: "Revisa tu bandeja de entrada",
  doneBefore: "Te acabo de enviar un enlace de confirmación a ",
  doneAfter: ". Tócalo y tu canción te estará esperando.",
  doneFine: "¿No lo ves? Revisa tu carpeta de spam o de promociones.",
  close: "CERRAR",
  closeAria: "Cerrar",
  errEmail: "Escribe un correo electrónico válido.",
  errSend: "No pudimos enviar el correo. Inténtalo de nuevo.",
  errServer: "Algo salió mal. Inténtalo de nuevo.",
};

const COPY: Record<Lang, Copy> = { en, es };

// Error codes returned by /api/claim-song -> translated message keys
const ERROR_CODES: Record<string, ErrKey> = {
  email: "errEmail",
  send: "errSend",
  server: "errServer",
};

type Props = {
  // Pass in locationDetected from gallery.tsx so location is still captured
  location?: string;
};

export default function WelcomePopup({ location = "" }: Props) {
  const { lang, setLang } = useLang();
  const c = COPY[lang];

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [errKey, setErrKey] = useState<ErrKey | null>(null);

  // Show once per visitor, after the gallery's fade-in has settled
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrKey(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/claim-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // lang decides which language the confirmation email is written in
        body: JSON.stringify({ email, location, lang }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrKey(ERROR_CODES[data.code] ?? "errServer");
        setStatus("idle");
        return;
      }

      setStatus("done");
      try {
        localStorage.setItem(STORAGE_KEY, "1");
        // Tells the map form this device already signed up, so it skips the email field
        localStorage.setItem("dc_subscribed", "1");
      } catch {}
    } catch {
      setErrKey("errServer");
      setStatus("idle");
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="welcome-backdrop" onClick={close}>
        <div
          className="welcome-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="welcome-lang">
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

          <button
            type="button"
            className="welcome-close"
            onClick={close}
            aria-label={c.closeAria}
          >
            ×
          </button>

          <div className="welcome-ornament" aria-hidden="true">
            <span className="line" />
            <span className="star">✦</span>
            <span className="line" />
          </div>

          {status !== "done" ? (
            <>
              <h2 id="welcome-title">{c.title}</h2>
              <p className="welcome-copy">{c.copy}</p>

              <form onSubmit={submit}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={c.placeholder}
                  aria-label={c.emailAria}
                  autoComplete="email"
                  required
                />
                <button type="submit" disabled={status === "loading"}>
                  {status === "loading" ? "..." : c.submit}
                </button>
              </form>

              {errKey && <p className="welcome-error">{c[errKey]}</p>}

              <p className="welcome-fine">{c.fine}</p>
            </>
          ) : (
            <>
              <h2 id="welcome-title">{c.doneTitle}</h2>
              <p className="welcome-copy">
                {c.doneBefore}
                <strong>{email}</strong>
                {c.doneAfter}
              </p>
              <p className="welcome-fine">{c.doneFine}</p>
              <button type="button" className="welcome-done" onClick={close}>
                {c.close}
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .welcome-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          background: rgba(60, 40, 80, 0.45);
          backdrop-filter: blur(5px);
          animation: welcomeFade 0.5s ease;
        }

        .welcome-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          padding: 2.4rem 2rem 1.8rem;
          text-align: center;
          border: 1px solid rgba(212, 173, 86, 0.65);
          border-radius: 4px;
          background: linear-gradient(180deg, #fbf5f0 0%, #f3d7d3 100%);
          box-shadow: 0 24px 70px rgba(60, 40, 80, 0.35);
          font-family: "Fraunces", Georgia, serif;
          color: #715a99;
        }

        .welcome-close {
          position: absolute;
          top: 8px;
          right: 14px;
          border: 0;
          background: none;
          color: #9680b8;
          font-size: 1.8rem;
          line-height: 1;
          cursor: pointer;
        }

        .welcome-lang {
          position: absolute;
          top: 12px;
          left: 14px;
          display: flex;
          gap: 4px;
        }

        .lang-btn {
          padding: 2px 8px;
          border: 1px solid rgba(150, 128, 184, 0.7);
          border-radius: 3px;
          background: transparent;
          color: #9680b8;
          font-family: inherit;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          cursor: pointer;
        }

        .lang-btn.active {
          background: #9680b8;
          color: #fffaf7;
        }

        .welcome-ornament {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.9rem;
          margin-bottom: 1.2rem;
        }

        .line {
          display: block;
          width: 60px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(150, 128, 184, 0.6)
          );
        }

        .line:last-child {
          background: linear-gradient(
            90deg,
            rgba(150, 128, 184, 0.6),
            transparent
          );
        }

        .star {
          color: #e16d99;
          font-size: 1.3rem;
        }

        h2 {
          margin: 0 0 0.7rem;
          font-size: 1.7rem;
          font-weight: 600;
          font-style: italic;
        }

        .welcome-copy {
          margin: 0 0 1.5rem;
          line-height: 1.55;
          font-size: 1.02rem;
        }

        form {
          display: grid;
          gap: 0.75rem;
        }

        input {
          width: 100%;
          padding: 1rem 1.1rem;
          border: 1px solid rgba(150, 128, 184, 0.72);
          border-radius: 3px;
          outline: none;
          background: rgba(255, 255, 255, 0.4);
          color: #715a99;
          font-family: inherit;
          font-size: 1.05rem;
          font-style: italic;
          font-weight: 600;
          letter-spacing: 0.04em;
          box-sizing: border-box;
        }

        input::placeholder {
          color: rgba(113, 90, 153, 0.7);
        }

        input:focus {
          border-color: #e16d99;
          background: rgba(255, 255, 255, 0.65);
        }

        form button,
        .welcome-done {
          width: 100%;
          display: block;
          padding: 1rem 1.1rem;
          border: 1px solid #9680b8;
          border-radius: 3px;
          background: linear-gradient(135deg, #a08bc0, #8068a7);
          color: #fffaf7;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-decoration: none;
          cursor: pointer;
        }

        form button:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .welcome-error {
          margin: 0.9rem 0 0;
          color: #e16d99;
          font-style: italic;
        }

        .welcome-fine {
          margin: 1.1rem 0 0;
          font-size: 0.76rem;
          opacity: 0.75;
        }

        @keyframes welcomeFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}