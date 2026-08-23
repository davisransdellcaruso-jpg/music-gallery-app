import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const AUDIO_URL =
  "https://bzllhepdcooxjekehkvc.supabase.co/storage/v1/object/public/Login%20page%20video/Denim%20Blues%20mp3.mp3";

export default function Story() {
  const [mounted, setMounted] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setMounted(true);

    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const startMusic = async () => {
    const audio = audioRef.current;

    if (!audio || musicStarted) return;

    try {
      audio.volume = 0.72;
      audio.muted = false;

      await audio.play();

      setMusicStarted(true);
      setIsMuted(false);
    } catch {}
  };

  useEffect(() => {
    if (!mounted) return;

    startMusic();

    const beginOnInteraction = () => {
      startMusic();

      document.removeEventListener("click", beginOnInteraction);
      document.removeEventListener("touchstart", beginOnInteraction);
    };

    document.addEventListener("click", beginOnInteraction, { once: true });
    document.addEventListener("touchstart", beginOnInteraction, {
      once: true,
    });

    return () => {
      document.removeEventListener("click", beginOnInteraction);
      document.removeEventListener("touchstart", beginOnInteraction);
    };
  }, [mounted, musicStarted]);

  const toggleSound = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (!musicStarted) {
      try {
        audio.volume = 0.72;
        audio.muted = false;

        await audio.play();

        setMusicStarted(true);
        setIsMuted(false);
      } catch {
        return;
      }

      return;
    }

    const nextMuted = !audio.muted;

    audio.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  if (!mounted) return null;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500;1,9..144,600&display=swap"
        rel="stylesheet"
      />

      {createPortal(
        <>
          <audio ref={audioRef} src={AUDIO_URL} loop preload="auto" />

          <div className="page-border" aria-hidden="true" />

          <main className={`story-page ${fadeIn ? "fade-in" : ""}`}>
            <section className="mission-section">
              <div className="story-inner">
                <div className="ornament ornament-top">
                  <span className="line" />
                  <span className="star">✦</span>
                  <span className="line" />
                </div>

                <header className="mission-header">
                  <h1>Current updates...</h1>
                </header>

                <div className="mission-copy">
                  <p className="opening-line">
                    Periwinkle (The Album) is currently being mixed, A content
                    strategy is being formulated and a clearly defined brand
                    will be born... stay tuned.
                  </p>
                </div>

                <div className="ornament statement-end">
                  <span className="line" />
                  <span className="star">✦</span>
                  <span className="line" />
                </div>
              </div>
            </section>

            <section className="shows-section">
              <div className="shows-inner">
                <p className="eyebrow">UPCOMING</p>

                <h2>shows</h2>

                <article className="show">
                  <div className="date">
                    <span className="month">SEPT</span>
                    <span className="day">12</span>
                  </div>

                  <div className="show-info">
                    <h3>Dally in the Alley</h3>
                    <p className="city">Detroit</p>
                    <p className="time">5:15 PM</p>
                  </div>
                </article>
              </div>
            </section>

            <footer className="footer">
              <div className="footer-inner">
                <a href="/gallery" className="back-link">
                  ← la famiglia
                </a>

                <div className="now-playing">
                  <span className="now-label">NOW PLAYING</span>
                  <span className="track">DENIM BLUES</span>
                </div>

                <button
                  type="button"
                  className="sound-button"
                  onClick={toggleSound}
                  aria-label={
                    isMuted || !musicStarted ? "Turn music on" : "Mute music"
                  }
                >
                  <span className="sound-word">SOUND</span>

                  <span className="sound-circle">
                    {isMuted || !musicStarted ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="4 9 8 9 12 5 12 19 8 15 4 15 4 9" />
                        <line x1="17" y1="9" x2="22" y2="14" />
                        <line x1="22" y1="9" x2="17" y2="14" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="4 9 8 9 12 5 12 19 8 15 4 15 4 9" />
                        <path d="M16 8.5a4.5 4.5 0 0 1 0 7" />
                        <path d="M18.5 6a8 8 0 0 1 0 12" />
                      </svg>
                    )}
                  </span>
                </button>
              </div>
            </footer>
          </main>

          <style jsx global>{`
            html,
            body {
              margin: 0;
              padding: 0;

              width: 100%;

              background: #e9b9b8;
            }

            body {
              overflow-x: hidden;
            }
          `}</style>

          <style jsx>{`
            * {
              box-sizing: border-box;
            }

            .story-page {
              --cream: #f7efe9;
              --cream-light: #fbf5f1;
              --lavender: #9680b8;
              --lavender-dark: #715a99;
              --pink: #e16d99;
              --pink-soft: #e79ab7;
              --gold: #d4ad56;
              --bandana-red: #c85765;
              --bandana-soft: #e9b9b8;
              --bandana-light: #f3d7d3;

              position: relative;

              width: 100%;
              min-height: 100vh;

              opacity: 0;

              color: var(--lavender-dark);

              font-family: "Fraunces", Georgia, serif;

              background:
                radial-gradient(
                  circle at 50% 0%,
                  rgba(255, 247, 244, 0.58),
                  transparent 45%
                ),
                linear-gradient(
                  180deg,
                  var(--bandana-light) 0%,
                  var(--bandana-soft) 100%
                );

              transition: opacity 1.35s ease;
            }

            .story-page::before {
              content: "";

              position: absolute;
              inset: 0;

              pointer-events: none;

              opacity: 0.075;

              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");

              background-size: 300px 300px;

              mix-blend-mode: multiply;

              z-index: 0;
            }

            .story-page > * {
              position: relative;
              z-index: 1;
            }

            .story-page.fade-in {
              opacity: 1;
            }

            .mission-section {
              min-height: 100vh;

              display: flex;
              align-items: center;
              justify-content: center;

              padding: clamp(5.5rem, 10vw, 9rem) 1.5rem clamp(5rem, 10vw, 8rem);
            }

            .story-inner {
              width: min(100%, 880px);
              margin: 0 auto;
            }

            .ornament {
              display: flex;
              justify-content: center;
              align-items: center;

              gap: 1.2rem;

              width: min(100%, 330px);

              margin-left: auto;
              margin-right: auto;
            }

            .ornament-top {
              margin-bottom: clamp(2.7rem, 6vw, 4rem);
            }

            .statement-end {
              margin-top: clamp(4rem, 9vw, 7rem);
            }

            .line {
              width: 105px;
              height: 1px;

              background: rgba(150, 128, 184, 0.4);
            }

            .star {
              color: var(--pink);
              font-size: 1.5rem;
              line-height: 1;
            }

            .mission-header {
              text-align: center;
            }

            .mission-header h1 {
              margin: 0;

              color: var(--lavender);

              font-family: "Fraunces", Georgia, serif;

              font-size: clamp(3.8rem, 8.5vw, 7.4rem);
              font-weight: 500;

              line-height: 0.82;
              letter-spacing: -0.025em;
            }

            .mission-copy {
              width: min(100%, 680px);

              margin: clamp(4.5rem, 9vw, 7rem) auto 0;
            }

            .mission-copy p {
              margin: 0 0 2.2rem;

              color: var(--lavender-dark);

              font-family: "Fraunces", Georgia, serif;

              font-size: clamp(1.45rem, 2.65vw, 1.95rem);
              font-weight: 400;

              line-height: 1.52;
            }

            .mission-copy .opening-line {
              color: var(--pink);

              font-size: clamp(1.65rem, 3vw, 2.15rem);
              font-style: italic;

              line-height: 1.4;
            }

            .shows-section {
              position: relative;

              padding: clamp(5.5rem, 10vw, 8rem) 1.5rem;

              background: rgba(255, 255, 255, 0.12);

              border-top: 1px solid rgba(150, 128, 184, 0.2);

              border-bottom: 1px solid rgba(150, 128, 184, 0.2);

              overflow: hidden;
            }

            .shows-section::before {
              content: "";

              position: absolute;
              inset: 0;

              pointer-events: none;

              opacity: 0.035;

              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");

              background-size: 260px 260px;

              z-index: 0;
            }

            .shows-inner {
              position: relative;
              z-index: 1;

              width: min(100%, 700px);

              margin: 0 auto;
            }

            .eyebrow {
              margin: 0;

              color: var(--pink);

              text-align: center;

              font-family: "Fraunces", Georgia, serif;

              font-size: 0.76rem;
              font-weight: 600;

              letter-spacing: 0.23em;
            }

            .shows-inner h2 {
              margin: 0.25rem 0 clamp(3rem, 6vw, 4.5rem);

              color: var(--lavender);

              text-align: center;

              font-family: "Fraunces", Georgia, serif;

              font-size: clamp(3.3rem, 7vw, 5.6rem);
              font-weight: 500;

              line-height: 1;
            }

            .show {
              display: grid;

              grid-template-columns:
                110px
                1fr;

              gap: clamp(2rem, 6vw, 4.5rem);

              align-items: center;

              padding: 2.7rem 0;

              border-top: 1px solid rgba(150, 128, 184, 0.32);

              border-bottom: 1px solid rgba(150, 128, 184, 0.32);
            }

            .date {
              display: flex;
              flex-direction: column;

              align-items: center;

              border-right: 1px solid rgba(150, 128, 184, 0.25);
            }

            .month {
              color: var(--pink);

              font-family: "Fraunces", Georgia, serif;

              font-size: 0.72rem;
              font-weight: 600;

              letter-spacing: 0.22em;
            }

            .day {
              margin-top: 0.2rem;

              color: var(--lavender);

              font-family: "Fraunces", Georgia, serif;

              font-size: 4rem;
              font-weight: 500;

              line-height: 1;
            }

            .show-info h3 {
              margin: 0 0 0.55rem;

              color: var(--lavender-dark);

              font-family: "Fraunces", Georgia, serif;

              font-size: clamp(1.9rem, 4vw, 2.8rem);
              font-weight: 500;

              line-height: 1.05;
            }

            .show-info p {
              margin: 0;
            }

            .city {
              color: var(--pink);

              font-family: "Fraunces", Georgia, serif;

              font-size: 1.15rem;
              font-style: italic;
            }

            .time {
              margin-top: 0.35rem !important;

              color: var(--lavender);

              font-family: "Fraunces", Georgia, serif;

              font-size: 0.82rem;
              font-weight: 600;

              letter-spacing: 0.14em;
            }

            .footer {
              padding: 3rem 1.5rem 3.5rem;
            }

            .footer-inner {
              display: grid;

              grid-template-columns:
                1fr
                auto
                1fr;

              align-items: center;

              width: min(100%, 1000px);

              margin: 0 auto;
            }

            .back-link {
              justify-self: start;

              color: var(--lavender);

              text-decoration: none;

              font-family: "Fraunces", Georgia, serif;

              font-size: 1rem;
              font-style: italic;
            }

            .now-playing {
              display: flex;
              flex-direction: column;

              align-items: center;

              gap: 0.15rem;
            }

            .now-label {
              color: var(--pink);

              font-family: "Fraunces", Georgia, serif;

              font-size: 0.62rem;
              font-weight: 600;

              letter-spacing: 0.16em;
            }

            .track {
              color: var(--lavender-dark);

              font-family: "Fraunces", Georgia, serif;

              font-size: 0.78rem;
              font-weight: 600;

              letter-spacing: 0.12em;
            }

            .sound-button {
              justify-self: end;

              display: flex;
              align-items: center;

              gap: 0.8rem;

              padding: 0;

              border: 0;

              color: var(--pink);
              background: none;

              cursor: pointer;
            }

            .sound-word {
              font-family: "Fraunces", Georgia, serif;

              font-size: 0.72rem;
              font-weight: 600;

              letter-spacing: 0.14em;
            }

            .sound-circle {
              display: flex;
              align-items: center;
              justify-content: center;

              width: 49px;
              height: 49px;

              border: 1px solid rgba(150, 128, 184, 0.65);

              border-radius: 50%;

              color: var(--lavender);
            }

            .sound-circle svg {
              width: 20px;
              height: 20px;
            }

            .page-border {
              position: fixed;
              inset: 11px;

              z-index: 9999;

              pointer-events: none;

              border: 1px solid rgba(212, 173, 86, 0.55);
            }

            @media (max-width: 600px) {
              .mission-section {
                min-height: auto;

                padding: 5.5rem 1.5rem 5rem;
              }

              .mission-header h1 {
                font-size: clamp(3.2rem, 16.5vw, 5rem);
              }

              .mission-copy {
                margin-top: 3.8rem;
              }

              .mission-copy p {
                font-size: 1.35rem;
              }

              .mission-copy .opening-line {
                font-size: 1.55rem;
              }

              .shows-section {
                padding: 5rem 1.5rem;
              }

              .show {
                grid-template-columns:
                  78px
                  1fr;

                gap: 1.5rem;
              }

              .day {
                font-size: 3.2rem;
              }

              .show-info h3 {
                font-size: 1.8rem;
              }

              .footer-inner {
                grid-template-columns:
                  1fr
                  1fr;

                row-gap: 2.5rem;
              }

              .now-playing {
                grid-column: 1 / -1;
                grid-row: 1;
              }

              .back-link {
                grid-column: 1;
                grid-row: 2;
              }

              .sound-button {
                grid-column: 2;
                grid-row: 2;
              }

              .sound-word {
                display: none;
              }

              .page-border {
                inset: 6px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .story-page {
                transition: none;
              }
            }
          `}</style>
        </>,
        document.body,
      )}
    </>
  );
}