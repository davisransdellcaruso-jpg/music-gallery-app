// pages/donation-success.tsx
import { useRouter } from "next/router";

export default function DonationSuccess() {
  const router = useRouter();

  return (
    <div className="donation-success-page">
      <div className="glow-behind"></div>
      <div className="clouds"></div>
      <div className="mist"></div>

      <div className="content">
        <h1 className="title">💜 Thank You</h1>
        <p className="message">
          Your donation means the world — you’re helping keep the music alive.  
          Every bit of support allows me to create more art and share it with you 🌌
        </p>
        <button onClick={() => router.push("/gallery")} className="dreamy-button">
          ← Back to Gallery
        </button>
        <button onClick={() => router.push("/store")} className="dreamy-button">
          Visit Store
        </button>
      </div>

      <style jsx>{`
        .donation-success-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          text-align: center;
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }

        .glow-behind {
          position: absolute;
          top: 20%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 180, 120, 0.6) 0%,
            rgba(255, 140, 100, 0.3) 40%,
            transparent 70%
          );
          filter: blur(50px);
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

        .clouds {
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 100%;
          background: url("/clouds.png") repeat-x;
          background-size: cover;
          opacity: 0.2;
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

        .content {
          z-index: 2;
          max-width: 600px;
        }

        .title {
          font-size: 3rem;
          margin-bottom: 1rem;
          font-family: "Didot", "Bodoni MT", serif;
        }

        .message {
          font-size: 1.3rem;
          margin-bottom: 2rem;
          font-style: italic;
          line-height: 1.6;
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          margin: 0.5rem;
          transition: background-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
        }
        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.9);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
