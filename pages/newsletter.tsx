import { useRouter } from "next/router";
/* eslint-disable react/no-unescaped-entities */

export default function Newsletter() {
  const router = useRouter();

  return (
    <div className="newsletter-page trocchi">
      <link
        href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
        rel="stylesheet"
      />

      {/* Background glow layers */}
      <div className="glow glow1" />
      <div className="glow glow2" />
      <div className="mist" />

      <button
        onClick={() => router.push("/gallery")}
        className="back-button dreamy-button"
      >
        ← Back to Gallery
      </button>

      <div className="newsletter-content">
        <h1 className="newsletter-title">November 2025 Newsletter</h1>

        <p>Hey ya,</p>
        <p>Glad you’re here‼</p>

        <p>
          — <b>Stucchi & The Shepherd</b> are about to release our debut soul
          record, <b>The Way Home</b>, featuring <b>Kyandé</b>, live at{" "}
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
          Lately I’ve been thinking a lot about what it means to make music in
          this era of infinite scroll and instant everything.
        </p>

        <p>
          We have every song ever made in our pockets, yet the artists making
          them are scraping by, and the listeners are left feeling… kinda empty.
          It’s like eating fast food when what we really need is a home-cooked
          meal.
        </p>

        <p>
          Together with my pals I'm imagining a culture where everyone has the
          chance to sustain themselves doing what they love. It seems far
          fetched, but dream with me, won’tcha? Someone once told me{" "}
          <i>
            “Generosity isn’t about how much you give, it's about how much you
            have left.”
          </i>{" "}
          I really liked that.
        </p>

        <p>
          Big love to everyone who’s already shown support — sharing, donating,
          showing up, sending kind words. You’re the reason we get to keep
          making noise, and we plan on doing some more of that.
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
          <b>Big Dog aka Dave</b>
        </p>
      </div>

      <style jsx>{`
        .trocchi {
          font-family: "Trocchi", serif;
        }
        .newsletter-page {
          position: relative;
          min-height: 100vh;
          background: linear-gradient(
            135deg,
            #2a004f 0%,
            #4b2a6f 50%,
            #2e1a47 100%
          );
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

        .back-button {
          align-self: flex-start;
          margin-bottom: 2rem;
          z-index: 2;
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .dreamy-button:hover {
          background: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.8);
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

        p {
          font-size: 1.1rem;
          margin-bottom: 1.25rem;
          line-height: 1.7;
        }

        .link {
          color: #aeb8fe;
          text-decoration: underline;
        }
        .link:hover {
          color: #d2c2ff;
        }
      `}</style>
    </div>
  );
}
