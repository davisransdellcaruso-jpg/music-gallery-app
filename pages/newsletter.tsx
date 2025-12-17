import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { Howl } from "howler";
/* eslint-disable react/no-unescaped-entities */

export default function Newsletter() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(true);
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    // Load and fade in music
    soundRef.current = new Howl({
      src: ["/Funky Soul Instrumental.mp3"],
      volume: 0,
      loop: true,
      html5: true,
    });

    const sound = soundRef.current;
    sound.play();
    sound.fade(0, 0.35, 4000); // fade in over 4s

    // Fade out on unmount
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
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Background glows */}
      <div className="glow glow1" />
      <div className="glow glow2" />
      <div className="mist" />

      {/* Top Navigation */}
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
        <h1 className="newsletter-title">December News</h1>

        <div className="brush-reveal">

          <p>Greetings,</p>
          <p>Happy December :)</p>

          <p>
            <b>Stucchi & The Shepherd</b> are on the road! Have a listen to our new record on bandcamp...
          </p>

          <p>
            ‼️{" "}
            <a
              href="https://stucchiats.bandcamp.com/album/the-way-home"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              The Way Home
            </a>
          </p>

          <p>
            Our road thusfar:
            ANN ARBOR MI // 
            CHICAGO IL //
            MINNEAPOLIS MN // 
            SIOUX FALLS SD //
            RAPID CITY SD //
            BOZEMAN MT //
            STANLEY ID //
            PENDLETON OR //
            SEATTLE WA //
            PORTLAND OR ...
          </p>

          <p>
            We have currently landed in Portland OR and grateful to all the people that helped us get here and sleep 
            comfortably along the way.  Thanks to all those listening & supporting the music, the creativity remains
            abundant and we look forward to sharing more as it comes together. Stay tuned!  
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
            if you wanna help us get home!
          </p>

          <p>
            Til next time... <br />
            Much love, <br />
            <b>Davis</b>
          </p>
        </div>
      </div>

      {/* Styles */}
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

        .brush-reveal p {
          font-size: 1.1rem;
          margin-bottom: 1.25rem;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
}
