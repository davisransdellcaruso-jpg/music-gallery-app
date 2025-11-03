import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
/* eslint-disable react/no-unescaped-entities */

export default function Newsletter() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(true);
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    // Load and fade in music
    soundRef.current = new Howl({
      src: ["/Funky Soul Instrumental.mp3"], // 🎵 your file in /public
      volume: 0,
      loop: true,
      html5: true,
    });

    const sound = soundRef.current;
    sound.play();
    sound.fade(0, 0.35, 4000); // fade in over 4s

    // Fade out gracefully when page unmounts
    return () => {
      if (sound) {
        sound.fade(0.35, 0, 3000);
        setTimeout(() => sound.stop(), 3000);
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.fade(0.35, 0, 1000);
      setTimeout(() => soundRef.current?.pause(), 1000);
    } else {
      soundRef.current.play();
      soundRef.current.fade(0, 0.35, 1000);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="newsletter-page trocchi">
      <link
        href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
        rel="stylesheet"
      />

      {/* Background glows */}
      <div className="glow glow1" />
      <div className="glow glow2" />
      <div className="mist" />

      <div className="top-buttons">
        <button
          onClick={() => router.push("/gallery")}
          className="dreamy-button"
        >
          ← Back to Gallery
        </button>
        <button onClick={toggleMusic} className="dreamy-button alt">
          {isPlaying ? "⏸ Pause Music" : "▶️ Play Music"}
        </button>
      </div>

      <div className="newsletter-content">
        <h1 className="newsletter-title">November 2025 Newsletter</h1>

        {/* Brush reveal text from your final draft */}
        <div className="brush-reveal">
          <p>Hey ya,</p>
          <p>Glad you’re here‼ It means a lot :)</p>

          <p>
            <b>Stucchi & The Shepherd</b> are releasing our debut soul record{" "}
            <i>The Way Home</i> — featuring the one and only <b>Kyandé</b> — live
            at{" "}
            <a
              href="https://theark.org/event/stucchi-the-shepherd-album-release-show/"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              The Ark in Ann Arbor
            </a>{" "}
            on <b>November 16th</b>.
          </p>

          <p>
            🎟️{" "}
            <a
              href="https://theark.org/event/stucchi-the-shepherd-album-release-show/"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Grab your tickets here
            </a>{" "}
            — and if you can’t make it, send someone who needs a little soul
            medicine 😉
          </p>

          <p>
            I often think of songwriting as archaeology — the music’s already
            there, waiting like fossils. My role is to uncover it gently,
            treating the process as sacred and mutualistic. The songs I find are
            just as glad to be found as I am to discover them.
          </p>

          <p>
            With the rise of Artificial Intelligence, I sometimes imagine
            bulldozers ripping through that same landscape — uprooting trees by
            the dozen, extracting songs without care for the land.
          </p>

          <p>
            I believe music is bigger than us — a living consciousness that
            knows the sincerity of the vessel it flows through. You can fake it
            through a speaker, but not on a stage. For this reason I’m investing
            more time into the live performance aspect right now as{" "}
            <b>Stucchi & The Shepherd</b> prepare to make our way around the
            country sharing and connecting with others who align with our
            vision.
          </p>

          <p>
            I’m challenging myself to set clear boundaries with the tools we
            use and to stay true to the goal: building sustainability for myself
            and my collaborators as creative entrepreneurs. My priorities differ
            from those of dominant culture — I value family, community, and
            artistic expression over pure profit.
          </p>

          <p>
            Big love to everyone who’s already shown support — sharing,
            donating, showing up, sending kind words. You’re the reason we get
            to keep making noise, and we plan on making plenty more!
          </p>

          <p>
            💜{" "}
            <a
              href="https://www.gofundme.com/f/help-stucchi-the-shepherd-find-their-way-home"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Here’s our GoFundMe
            </a>{" "}
            if you wanna help us hit the road.
          </p>

          <p>
            Til next time — stay cool, but keep warm... <br />
            Much love, <br />
            <b>Davis</b>
          </p>
        </div>
      </div>

      <style jsx>{`
        .trocchi {
          font-family: "Trocchi", serif;
        }

        .newsletter-page {
          position: relative;
          min-height: 100vh;
          background: linear-gradient(135deg, #2a004f 0%, #4b2a6f 50%, #2e1a47 100%);
          color: white;
          overflow: hidden;
          padding: 3rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(160px);
          opacity: 0.5;
          animation: pulse 12s ease-in-out infinite alternate;
        }
        .glow1 {
          width: 500px;
          height: 500px;
          top: -200px;
          left: -150px;
          background: rgba(168, 85, 247, 0.5);
        }
        .glow2 {
          width: 400px;
          height: 400px;
          bottom: -100px;
          right: -120px;
          background: rgba(99, 102, 241, 0.5);
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

        .mist {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0) 70%
          );
          pointer-events: none;
        }

        .top-buttons {
          display: flex;
          gap: 1rem;
          align-self: flex-start;
          margin-bottom: 2rem;
          z-index: 2;
        }

        .dreamy-button {
          background-color: rgba(174, 184, 254, 0.2);
          border: 1px solid rgba(174, 184, 254, 0.4);
          color: #e4e1ff;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-weight: bold;
          cursor: pointer;
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
        }
        .dreamy-button:hover {
          background: rgba(174, 184, 254, 0.35);
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.8);
        }
        .dreamy-button.alt {
          color: #d7cfff;
        }

        .newsletter-content {
          z-index: 2;
          max-width: 700px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 0 25px rgba(168, 85, 247, 0.3);
        }

        .newsletter-title {
          font-size: 2rem;
          text-align: center;
          margin-bottom: 2rem;
          font-weight: bold;
        }

        .link {
          color: #aeb8fe;
          text-decoration: underline;
        }
        .link:hover {
          color: #d2c2ff;
        }

        /* Brush reveal preserved */
        .brush-reveal p {
          font-size: 1.1rem;
          margin-bottom: 1.25rem;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
}
