// components/WelcomePopup.tsx
import { useEffect, useState } from "react";
import { useLang, type Lang } from "./i18n";
import { trackRedditCustom } from "../lib/redditPixel";
import { getSource, logSignupEvent } from "../lib/signupTracking";

const STORAGE_KEY = "dc_welcome_seen";

const en = {
  // Step 1: the offer (the song leads, staying in touch comes with it)
  kicker: "A SONG FOR YOU",
  title: "Hear an unreleased song from Periwinkle",
  copy: "Tell me where to send it. Every so often I'll also send new music, shows, and stories.",
  placeholder: "your email",
  emailAria: "Your email",
  submit: "SEND ME THE SONG",
  fine: "No spam. Unsubscribe anytime.",
  // Step 2: check your inbox
  doneTitle: "Check your inbox",
  doneBefore: "Your song is on its way to ",
  doneAfter: '. Open the email and tap "Get my song".',
  doneFine: "Nothing there in a minute? Check your spam or promotions folder.",
  close: "CLOSE",
  closeAria: "Close",
  errEmail: "Please enter a valid email.",
  errSend: "Couldn't send the email. Please try again.",
  errServer: "Something went wrong. Please try again.",
};

type Copy = typeof en;
type ErrKey = "errEmail" | "errSend" | "errServer";

const es: Copy = {
  kicker: "UNA CANCIÓN PARA TI",
  title: "Escucha una canción inédita de Periwinkle",
  copy: "Dime a dónde enviártela. De vez en cuando también te enviaré música nueva, conciertos e historias.",
  placeholder: "tu correo electrónico",
  emailAria: "Tu correo electrónico",
  submit: "ENVÍAME LA CANCIÓN",
  fine: "Nada de spam. Puedes darte de baja cuando quieras.",
  doneTitle: "Revisa tu bandeja de entrada",
  doneBefore: "Tu canción va en camino a ",
  doneAfter: '. Abre el correo y toca "Quiero mi canción".',
  doneFine: "¿No llega en un minuto? Revisa tu carpeta de spam o de promociones.",
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
  // "popup": shows once per visitor over the page (the gallery).
  // "inline": always-visible card for a page of its own (/song).
  variant?: "popup" | "inline";
  // Popup only: open right away, even if they've seen it before
  // (used when someone taps the "Get the song" button)
  forceOpen?: boolean;
  onClose?: () => void;
};

function visitorId(): string | null {
  try {
    return localStorage.getItem("dc_visitor_id");
  } catch {
    return null;
  }
}

export default function WelcomePopup({
  location = "",
  variant = "popup",
  forceOpen = false,
  onClose,
}: Props) {
  const { lang, setLang } = useLang();
  const c = COPY[lang];
  const inline = variant === "inline";

  const [open, setOpen] = useState(inline || forceOpen);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [errKey, setErrKey] = useState<ErrKey | null>(null);

  // Popup: show once per visitor, after the gallery's fade-in has settled
  useEffect(() => {
    if (inline) {
      logSignupEvent("shown");
      return;
    }
    if (forceOpen) {
      logSignupEvent("shown");
      trackRedditCustom("Popup Shown");
      return;
    }
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      if (localStorage.getItem("dc_subscribed")) return;
    } catch {}
    const t = setTimeout(() => {
      setOpen(true);
      logSignupEvent("shown");
      trackRedditCustom("Popup Shown");
    }, 400);
    return () => clearTimeout(t);
  }, [inline, forceOpen]);

  const close = () => {
    // Closed without giving an email
    if (status !== "done") {
      logSignupEvent("dismissed");
      trackRedditCustom("Popup Dismissed");
    }
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    onClose?.();
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
        body: JSON.stringify({
          email,
          location,
          lang,
          source: getSource(),
          visitorId: visitorId(),
          page: window.location.pathname,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrKey(ERROR_CODES[data.code] ?? "errServer");
        setStatus("idle");
        return;
      }

      // The email is saved and the song email is on its way
      setStatus("done");
      trackRedditCustom("Email Signup");
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
      {/* styled-jsx only styles elements written inside this return,
          so the card lives here and only the wrapper changes */}
      <div
        className={inline ? "welcome-inline-wrap" : "welcome-backdrop"}
        onClick={inline ? undefined : close}
      >
        <div
          className={inline ? "welcome-card inline" : "welcome-card"}
          role={inline ? undefined : "dialog"}
          aria-modal={inline ? undefined : true}
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

          {!inline && (
            <button
              type="button"
              className="welcome-close"
              onClick={close}
              aria-label={c.closeAria}
            >
              ×
            </button>
          )}

          <div className="welcome-ornament" aria-hidden="true">
            <span className="line" />
            <span className="star">✦</span>
            <span className="line" />
          </div>

          {status !== "done" ? (
            <>
              <p className="welcome-kicker">{c.kicker}</p>
              <h2 id="welcome-title">{c.title}</h2>
              <p className="welcome-copy">{c.copy}</p>

              <form onSubmit={submit}>
                <input
                  type="email"
                  inputMode="email"
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
              {!inline && (
                <button type="button" className="welcome-done" onClick={close}>
                  {c.close}
                </button>
              )}
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

        .welcome-inline-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .welcome-kicker {
          margin: 0 0 0.5rem;
          color: #e16d99;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.24em;
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

        .welcome-skip {
          display: block;
          margin: 0.9rem auto 0;
          padding: 0.4rem 0.8rem;
          border: 0;
          background: none;
          color: #9680b8;
          font-family: inherit;
          font-size: 0.9rem;
          font-style: italic;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }

        .welcome-done:disabled,
        .welcome-skip:disabled,
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

        @media (max-width: 420px) {
          .welcome-card {
            padding: 2.4rem 1.4rem 1.5rem;
          }

          h2 {
            font-size: 1.45rem;
          }
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