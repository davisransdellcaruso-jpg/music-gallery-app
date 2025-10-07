// pages/learn.tsx
import { useRouter } from "next/router";

export default function Learn() {
  const router = useRouter();

  return (
    <div className="learn-page">
      {/* Background layers */}
      <div className="glow-behind"></div>
      <div className="clouds"></div>
      <div className="mist"></div>

      {/* Navigation */}
      <div className="nav-bar">
        <button onClick={() => router.push("/gallery")} className="dreamy-button">
          ← Back to Gallery
        </button>
        <button onClick={() => router.push("/welcome")} className="dreamy-button">
          Welcome 🏠
        </button>
      </div>

      {/* Header block */}
      <div className="title-block">
        <h1 className="brand-title">Davis Caruso</h1>
        <div className="underline"></div>
        <p className="tagline">art &amp; story</p>
      </div>

      {/* Content placeholder */}
      <p className="info-text">
        📖 Learn page under construction — check back soon!
      </p>

      <style jsx>{`
        .learn-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          color: white;
        }

        .glow-behind {
          position: absolute;
          top: 20%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 180, 120, 0.6) 0%,
            rgba(255, 140, 100, 0.3) 40%,
            transparent 70%
          );
          filter: blur(40px);
          z-index: 0;
          animation: pulse 8s ease-in-out infinite alternate;
        }

        @keyframes pulse {
          from {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.7;
          }
          to {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 1;
          }
        }

        .nav-bar {
          width: 100%;
          max-width: 1200px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .title-block {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .brand-title {
          font-size: 3rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: "Eurostile", "Futura", "Helvetica Neue", sans-serif;
        }

        .underline {
          width: 120px;
          height: 3px;
          margin: 0.5rem auto 1rem;
          background: linear-gradient(to right, #ff6b4a, #ffb347);
          border-radius: 2px;
        }

        .tagline {
          font-style: italic;
          font-size: 1.3rem;
          color: #ddd;
          font-family: "Didot", "Bodoni MT", serif;
        }

        .info-text {
          color: #ddd;
          font-size: 1.5rem;
          max-width: 600px;
          text-align: center;
          line-height: 1.6;
          z-index: 2;
          position: relative;
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
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
