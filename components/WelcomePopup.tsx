import { useEffect, useState } from "react";

const STORAGE_KEY = "dc_welcome_seen";

type Props = {
  // Pass in locationDetected from gallery.tsx so location is still captured
  location?: string;
};

export default function WelcomePopup({ location = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

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
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/claim-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, location }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setStatus("done");
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
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
          <button
            type="button"
            className="welcome-close"
            onClick={close}
            aria-label="Close"
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
              <h2 id="welcome-title">A song for you</h2>
              <p className="welcome-copy">
                An unreleased song from my new album, &quot;Periwinkle&quot;,
                free when you join.
              </p>

              <form onSubmit={submit}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your email"
                  aria-label="Your email"
                  autoComplete="email"
                  required
                />
                <button type="submit" disabled={status === "loading"}>
                  {status === "loading" ? "..." : "SEND ME THE SONG"}
                </button>
              </form>

              {error && <p className="welcome-error">{error}</p>}

              <p className="welcome-fine">
                Plus occasional news. Unsubscribe anytime.
              </p>
            </>
          ) : (
            <>
              <h2 id="welcome-title">Check your inbox</h2>
              <p className="welcome-copy">
                I just sent a confirmation link to <strong>{email}</strong>.
                Tap it and your song is waiting.
              </p>
              <p className="welcome-fine">
                Nothing there? Check your spam or promotions folder.
              </p>
              <button type="button" className="welcome-done" onClick={close}>
                CLOSE
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