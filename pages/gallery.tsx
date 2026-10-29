import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { getCurrentRelease } from "../lib/releases";
import WelcomePopup from "../components/WelcomePopup";
import ExploreMenu from "../components/ExploreMenu";
import MoodCheckIn from "../components/MoodCheckIn";
import { trackRedditCustom } from "../lib/redditPixel";

const HERO_VIDEO_URL =
  "https://bzllhepdcooxjekehkvc.supabase.co/storage/v1/object/public/Login%20page%20video/daviscaruso%20presents%20edit.mp4";

// Still image shown while the video loads, and instead of it if a browser
// can't play the video at all. Upload a frame from the video with this name
// (or change the link) so nobody ever sees an empty box.
const HERO_POSTER_URL =
  "https://bzllhepdcooxjekehkvc.supabase.co/storage/v1/object/public/Login%20page%20video/daviscaruso%20presents%20edit.jpg";

export default function Gallery() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const heroRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mounted, setMounted] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  const [locationDetected, setLocationDetected] = useState("");

  const [isMuted, setIsMuted] = useState(true);
  const [musicStarted, setMusicStarted] = useState(false);

  // Whichever song is the newest release as of today (Detroit time)
  const [release] = useState(getCurrentRelease);

  useEffect(() => {
    setMounted(true);

    const fadeTimer = setTimeout(() => {
      setFadeIn(true);
    }, 100);

    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const detected = [data.city, data.region, data.country_name]
          .filter(Boolean)
          .join(", ");

        setLocationDetected(detected);
      })
      .catch(() => {});

    return () => {
      clearTimeout(fadeTimer);

      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const fadeMusicIn = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    audio.volume = 0;

    const targetVolume = 0.72;
    const steps = 30;
    const stepAmount = targetVolume / steps;

    fadeIntervalRef.current = setInterval(() => {
      if (!audioRef.current) return;

      const newVolume = Math.min(
        audioRef.current.volume + stepAmount,
        targetVolume
      );

      audioRef.current.volume = newVolume;

      if (newVolume >= targetVolume) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }
    }, 100);
  };

  const startMusic = async (fromUserGesture = false) => {
    const audio = audioRef.current;

    if (!audio) return false;

    try {
      audio.muted = false;
      audio.volume = 0;

      await audio.play();

      setMusicStarted(true);
      setIsMuted(false);

      fadeMusicIn();
      return true;
    } catch {
      // Browsers normally block audible autoplay until the visitor interacts.
      // Keep the track running silently so it can be revealed immediately on
      // the first click, tap, or key press.
      if (!fromUserGesture) {
        try {
          audio.muted = true;
          audio.volume = 0.72;

          await audio.play();

          setMusicStarted(true);
          setIsMuted(true);
        } catch {}
      }

      return false;
    }
  };

  useEffect(() => {
    if (!mounted) return;

    void startMusic();

    const beginOnInteraction = async (event: Event) => {
      const target = event.target;

      // Let the SOUND button manage its own click without double-toggling.
      if (
        target instanceof Element &&
        target.closest(".sound-button")
      ) {
        return;
      }

      const started = await startMusic(true);

      if (started) {
        document.removeEventListener("pointerdown", beginOnInteraction);
        document.removeEventListener("keydown", beginOnInteraction);
      }
    };

    document.addEventListener("pointerdown", beginOnInteraction);
    document.addEventListener("keydown", beginOnInteraction);

    return () => {
      document.removeEventListener("pointerdown", beginOnInteraction);
      document.removeEventListener("keydown", beginOnInteraction);
    };
  }, [mounted]);

  // React doesn't reliably write the `muted` attribute, and browsers only
  // autoplay muted videos, so set it directly and nudge playback. If the
  // browser still held it back (e.g. iOS Low Power Mode), the first tap starts it.
  useEffect(() => {
    if (!mounted || videoFailed) return;
    const v = heroRef.current;
    if (!v) return;

    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    void v.play().catch(() => {});

    const kick = () => {
      void v.play().catch(() => {});
    };
    document.addEventListener("pointerdown", kick, { once: true });
    return () => document.removeEventListener("pointerdown", kick);
  }, [mounted, videoFailed]);

  const toggleSound = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!musicStarted) {
      try {
        audio.muted = false;
        audio.volume = 0.72;

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

  // Reddit Pixel: one handler per icon row. It reads the label under the
  // clicked icon (e.g. "Instagram") and sends "Social Click - Instagram".
  const trackLinkClick =
    (prefix: string) => (e: MouseEvent<HTMLDivElement>) => {
      const link = (e.target as Element).closest("a");
      const name = link?.querySelector(".social-name")?.textContent?.trim();
      if (name) trackRedditCustom(`${prefix} - ${name}`);
    };

  if (!mounted) return null;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500;1,9..144,600&display=swap"
        rel="stylesheet"
      />

      {createPortal(
        <>
          <audio
            key={release.audioUrl}
            ref={audioRef}
            src={release.audioUrl}
            loop
            preload="auto"
            autoPlay
            muted={isMuted}
            playsInline
          />

          <div className="page-border" aria-hidden="true" />
          <div className="grain-overlay" aria-hidden="true" />

          <main className={`gallery-page ${fadeIn ? "fade-in" : ""}`}>
            <section className="photo-section">
              {videoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={HERO_POSTER_URL}
                  alt="Davis Caruso"
                  className="hero-photo"
                />
              ) : (
                <video
                  ref={heroRef}
                  src={HERO_VIDEO_URL}
                  poster={HERO_POSTER_URL}
                  className="hero-photo"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  aria-label="Davis Caruso"
                  onError={() => setVideoFailed(true)}
                />
              )}
            </section>

            <section className="famiglia-section">
              <div className="famiglia-inner">
                <div className="ornament ornament-top">
                  <span className="ornament-line" />
                  <span className="star">✦</span>
                  <span className="ornament-line" />
                </div>

                <div
                  className="social-grid"
                  onClick={trackLinkClick("Social Click")}
                >
                  <a
                    href="https://www.instagram.com/dav_wav_/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.65"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="2.5"
                          y="2.5"
                          width="19"
                          height="19"
                          rx="5"
                        />
                        <circle cx="12" cy="12" r="4.2" />
                        <circle cx="17.5" cy="6.5" r="0.8" />
                      </svg>
                    </span>
                    <span className="social-name">Instagram</span>
                  </a>

                  <a
                    href="https://www.tiktok.com/@dav_wav_?_t=ZT-90R8qRubZ2E&_r=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon">
                      <svg viewBox="0 0 256 256" fill="currentColor">
                        <path d="M180.7 53.4c9.8 9.4 22.7 15.4 37.2 16.3v40.5c-13.3-.1-26.5-2.7-38.9-7.7v61.9c0 47.8-38.7 86.6-86.5 86.6-47.9 0-86.5-38.8-86.5-86.6 0-47.9 38.7-86.6 86.5-86.6 4.7 0 9.4.4 14 1.2v43.7c-4.5-1.4-9.2-2.1-14-2.1-24.3 0-44 19.8-44 44.1 0 24.3 19.8 44.1 44 44.1 24.2 0 44-19.8 44-44.1V12h43.7c.8 14.6 6.8 27.5 16.5 37.4z" />
                      </svg>
                    </span>
                    <span className="social-name">TikTok</span>
                  </a>

                  <a
                    href="https://www.facebook.com/DavisCarusoMusic/?rdid=nTaJjpsEu63FSUx7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.7-1.6 1.5V12H17l-.5 3h-2.3v7A10 10 0 0 0 22 12" />
                      </svg>
                    </span>
                    <span className="social-name">Facebook</span>
                  </a>

                  <a
                    href="https://substack.com/@daviscaruso"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="3" width="18" height="3" />
                        <rect x="3" y="8.4" width="18" height="3" />
                        <path d="M3 13.8h18v2.9L12 22 3 16.7z" />
                      </svg>
                    </span>
                    <span className="social-name">Substack</span>
                  </a>

                  <a
                    href="https://www.reddit.com/r/DavisCaruso/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="14" r="7" />
                        <circle
                          cx="8.7"
                          cy="14"
                          r="1.05"
                          fill="currentColor"
                          stroke="none"
                        />
                        <circle
                          cx="15.3"
                          cy="14"
                          r="1.05"
                          fill="currentColor"
                          stroke="none"
                        />
                        <path d="M8.7 17.3c1 .75 2.1 1.1 3.3 1.1s2.3-.35 3.3-1.1" />
                        <path d="M12 7V4.2" />
                        <circle
                          cx="12"
                          cy="3.3"
                          r="0.9"
                          fill="currentColor"
                          stroke="none"
                        />
                        <path d="M17.1 8.4a1.5 1.5 0 1 1 1.85 1.45" />
                      </svg>
                    </span>
                    <span className="social-name">Reddit</span>
                  </a>

                  <a
                    href="https://www.linkedin.com/in/davis-caruso-5b29072b1/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2.5" y="2.5" width="19" height="19" rx="3" />
                        <rect
                          x="6.3"
                          y="9.7"
                          width="2.9"
                          height="8.3"
                          fill="var(--bandana-light, #f3d7d3)"
                        />
                        <circle
                          cx="7.75"
                          cy="6.4"
                          r="1.7"
                          fill="var(--bandana-light, #f3d7d3)"
                        />
                        <path
                          d="M11.6 9.7h2.8v1.3c.5-.85 1.5-1.5 3-1.5 2.5 0 3.3 1.6 3.3 4v4.5h-2.9v-3.95c0-1.05-.35-1.8-1.35-1.8-1 0-1.55.7-1.55 1.8v3.95h-2.9V9.7z"
                          fill="var(--bandana-light, #f3d7d3)"
                        />
                      </svg>
                    </span>
                    <span className="social-name">LinkedIn</span>
                  </a>
                </div>

                <div
                  className="social-grid music-grid"
                  onClick={trackLinkClick("Music Click")}
                >
                  <a
                    href="https://davisransdellcaruso.bandcamp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon bandcamp">
                      <svg viewBox="0 0 256 256" fill="currentColor">
                        <path d="M21 194L112 62c2.3-3.4 6.1-5.4 10.2-5.4H235c6.4 0 10.2 7.2 6.6 12.4L150 201c-2.3 3.4-6.1 5.4-10.2 5.4H27.6C21.2 206.4 17.4 199.2 21 194z" />
                      </svg>
                    </span>
                    <span className="social-name">Bandcamp</span>
                  </a>

                  <a
                    href="https://soundcloud.com/davis-ransdell-caruso"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon soundcloud">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2.5 12.2v3.6" />
                        <path d="M5 10.8v6.4" />
                        <path d="M7.5 9.5v7.8" />
                        <path
                          d="M10 8.4v9c0 .17.13.3.3.3h8.3a3.4 3.4 0 0 0 .4-6.78 4.1 4.1 0 0 0-7.72-1.9c-.32-.4-.7-.64-1.28-.62Z"
                          fill="currentColor"
                          stroke="none"
                        />
                      </svg>
                    </span>
                    <span className="social-name">SoundCloud</span>
                  </a>

                  <a
                    href="https://www.youtube.com/@dav_wav"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon youtube">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.5 6.2s-.2-1.7-.8-2.4c-.8-.9-1.7-.9-2.1-1C17.7 2.5 12 2.5 12 2.5s-5.7 0-8.6.3c-.4.1-1.3.1-2.1 1-.6.7-.8 2.4-.8 2.4S0 8.1 0 10v2c0 1.9.2 3.8.2 3.8s.2 1.7.8 2.4c.8.9 1.9.9 2.4 1 1.7.2 7.1.3 8.6.3s5.7 0 8.6-.3c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.4.8-2.4s.2-1.9.2-3.8v-2c0-1.9-.2-3.8-.2-3.8zM9.6 14.8V7.8l6.4 3.5-6.4 3.5z" />
                      </svg>
                    </span>
                    <span className="social-name">YouTube</span>
                  </a>

                  <a
                    href="https://open.spotify.com/artist/1farxYUoZYKb4pzsSA1Si1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon spotify">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M6.5 9.2c3.6-1.1 7.6-.8 11 1" fill="none" stroke="var(--bandana-light, #f3d7d3)" strokeWidth="1.9" strokeLinecap="round" />
                        <path d="M7.2 12.7c3-.8 6.1-.5 8.8 1" fill="none" stroke="var(--bandana-light, #f3d7d3)" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M8 16c2.4-.6 4.6-.4 6.6.7" fill="none" stroke="var(--bandana-light, #f3d7d3)" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="social-name">Spotify</span>
                  </a>

                  <a
                    href="https://music.apple.com/us/artist/davis-caruso/1669967306"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon apple">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 17.5V6.2l10-2v11.3" />
                        <circle cx="6.8" cy="17.6" r="2.3" fill="currentColor" />
                        <circle cx="16.8" cy="15.6" r="2.3" fill="currentColor" />
                      </svg>
                    </span>
                    <span className="social-name">Apple Music</span>
                  </a>

                  <a
                    href="https://www.deezer.com/mx/artist/200375387"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    <span className="social-icon deezer">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        {[1, 2, 3, 3, 4].map((n, col) =>
                          Array.from({ length: n }).map((_, i) => (
                            <rect
                              key={`${col}-${i}`}
                              x={1.2 + col * 4.6}
                              y={20 - (i + 1) * 3.6 + 0.6}
                              width="3.6"
                              height="3"
                            />
                          ))
                        )}
                      </svg>
                    </span>
                    <span className="social-name">Deezer</span>
                  </a>
                </div>

                <div className="ornament ornament-bottom">
                  <span className="ornament-line" />
                  <span className="star">✦</span>
                  <span className="ornament-line" />
                </div>

                <div className="bottom-row">
                  <div className="now-playing">
                    <div className="monogram">DC</div>

                    <div className="track-copy">
                      <span className="track-label">NOW PLAYING</span>
                      <span className="track-title">
                        {release.title.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="sound-button"
                    onClick={toggleSound}
                    aria-label={
                      isMuted ? "Turn music on" : "Mute music"
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

                <p className="privacy-link">
                  <a href="/privacy">Privacy</a>
                </p>
              </div>
            </section>
          </main>

          <ExploreMenu />
          <MoodCheckIn />

          <WelcomePopup location={locationDetected} />

          <style jsx global>{`
            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              background: #f7efe9;
            }

            html {
              scroll-behavior: smooth;
            }

            body {
              overflow-x: hidden;
              font-family: "Fraunces", Georgia, serif;
            }

            button,
            input {
              font: inherit;
            }
          `}</style>

          <style jsx>{`
            * {
              box-sizing: border-box;
            }

            .gallery-page {
              --cream: #f7efe9;
              --cream-light: #fbf5f0;
              --lavender: #9680b8;
              --lavender-dark: #715a99;
              --lavender-light: #b8a5cd;
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
              background: var(--cream);

              transition: opacity 1.4s ease;
            }

            .gallery-page.fade-in {
              opacity: 1;
            }

            .photo-section {
              position: relative;
              width: 100%;
              line-height: 0;
              background: #eee8e4;
            }

            .hero-photo {
              display: block;
              width: 100%;
              height: auto;
              object-fit: contain;
            }

            .famiglia-section {
              position: relative;
              width: 100%;

              padding:
                clamp(3.4rem, 7vw, 6.5rem)
                1.5rem
                clamp(2.2rem, 5vw, 4rem);

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

              overflow: hidden;
            }

            .famiglia-section::before {
              content: "";
              position: absolute;
              inset: 0;

              pointer-events: none;

              opacity: 0.075;

              background-image:
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");

              background-size: 300px 300px;
              mix-blend-mode: multiply;

              z-index: 0;
            }

            .famiglia-inner {
              position: relative;
              z-index: 1;

              width: min(100%, 920px);
              margin: 0 auto;
            }

            .ornament {
              display: flex;
              justify-content: center;
              align-items: center;

              gap: 1.25rem;

              width: min(100%, 330px);

              margin-left: auto;
              margin-right: auto;
            }

            .ornament-line {
              display: block;
              width: 110px;
              height: 1px;

              background: linear-gradient(
                90deg,
                transparent,
                rgba(150, 128, 184, 0.55)
              );
            }

            .ornament-line:last-child {
              background: linear-gradient(
                90deg,
                rgba(150, 128, 184, 0.55),
                transparent
              );
            }

            .star {
              color: var(--pink);
              font-size: 1.55rem;
              line-height: 1;
            }

            .ornament-top {
              margin-bottom: 2.1rem;
            }

            .ornament-bottom {
              margin-top: clamp(3.3rem, 7vw, 5.5rem);
              margin-bottom: 2.2rem;
            }

            .social-grid {
              display: flex;
              flex-wrap: nowrap;

              justify-content: center;

              gap: 1.6rem;

              width: min(100%, 960px);

              margin: clamp(2.8rem, 6vw, 4rem) auto 0;
            }

            .music-grid {
              margin-top: 2rem;
            }

            .social-link {
              display: flex;
              flex-direction: column;
              align-items: center;

              gap: 0.6rem;

              flex: 0 0 auto;
              width: 78px;

              color: var(--lavender);

              text-decoration: none;

              transition:
                color 0.2s ease,
                transform 0.2s ease;
            }

            .social-link:hover {
              color: var(--pink);
              transform: translateY(-3px);
            }

            .social-icon {
              display: flex;
              align-items: center;
              justify-content: center;

              width: 38px;
              height: 38px;
            }

            .social-icon svg {
              display: block;
              width: 29px;
              height: 29px;
            }

            .social-icon.youtube svg {
              width: 31px;
            }

            .social-icon.bandcamp svg {
              width: 33px;
            }

            .social-icon.spotify svg,
            .social-icon.deezer svg {
              width: 31px;
              height: 31px;
            }

            .social-icon.soundcloud svg {
              width: 31px;
            }

            .social-name {
              width: 100%;

              font-family: "Fraunces", Georgia, serif;
              font-size: 0.72rem;
              font-weight: 600;

              letter-spacing: 0.08em;
              text-align: center;

              text-transform: uppercase;
            }

            .bottom-row {
              display: flex;
              justify-content: space-between;
              align-items: center;

              gap: 2rem;

              width: 100%;
            }

            .now-playing {
              display: flex;
              align-items: center;

              gap: 1rem;
            }

            .monogram {
              display: flex;
              align-items: center;
              justify-content: center;

              flex-shrink: 0;

              width: 58px;
              height: 58px;

              border: 1px solid rgba(150, 128, 184, 0.66);
              border-radius: 50%;

              color: var(--lavender);

              font-family: "Fraunces", Georgia, serif;
              font-size: 1.25rem;
              font-weight: 600;
            }

            .track-copy {
              display: flex;
              flex-direction: column;

              gap: 0.15rem;
            }

            .track-label {
              color: var(--pink);

              font-family: "Fraunces", Georgia, serif;
              font-size: 0.72rem;
              font-weight: 600;

              letter-spacing: 0.13em;
            }

            .track-title {
              color: var(--lavender-dark);

              font-family: "Fraunces", Georgia, serif;
              font-size: 0.92rem;
              font-weight: 600;

              letter-spacing: 0.1em;
            }

            .sound-button {
              display: flex;
              align-items: center;

              gap: 0.9rem;

              padding: 0;

              border: 0;

              color: var(--pink);
              background: none;

              cursor: pointer;
            }

            .sound-word {
              font-family: "Fraunces", Georgia, serif;
              font-size: 0.78rem;
              font-weight: 600;

              letter-spacing: 0.13em;
            }

            .sound-circle {
              display: flex;
              align-items: center;
              justify-content: center;

              width: 52px;
              height: 52px;

              border: 1px solid rgba(150, 128, 184, 0.7);
              border-radius: 50%;

              color: var(--lavender);
            }

            .sound-circle svg {
              width: 22px;
              height: 22px;
            }

            .privacy-link {
              margin: 2.2rem 0 0;
              text-align: center;
              font-size: 0.72rem;
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }

            .privacy-link a {
              color: var(--lavender);
              text-decoration: none;
            }

            .privacy-link a:hover {
              color: var(--pink);
            }

            .page-border {
              position: fixed;
              inset: 11px;

              z-index: 9999;

              pointer-events: none;

              border: 1px solid rgba(212, 173, 86, 0.55);
            }

            .grain-overlay {
              position: fixed;
              inset: 0;

              z-index: 9998;

              pointer-events: none;

              opacity: 0.025;

              background-image:
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");

              background-size: 300px 300px;
            }

            @media (max-width: 850px) {
              .social-grid {
                flex-wrap: wrap;
                gap: 1.9rem 1rem;
              }

              .social-link {
                width: 74px;
              }
            }

            @media (max-width: 600px) {
              .famiglia-section {
                padding:
                  3.2rem
                  1.35rem
                  2.4rem;
              }

              .social-grid {
                gap: 1.6rem 0.75rem;
              }

              .social-link {
                width: 72px;
              }

              .social-name {
                font-size: 0.62rem;
                letter-spacing: 0.04em;
              }

              .monogram {
                width: 48px;
                height: 48px;
              }

              .sound-word {
                display: none;
              }

              .sound-circle {
                width: 48px;
                height: 48px;
              }

              .page-border {
                inset: 6px;
              }
            }
          `}</style>
        </>,
        document.body
      )}
    </>
  );
}