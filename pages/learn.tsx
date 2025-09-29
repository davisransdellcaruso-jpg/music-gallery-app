// pages/learn.tsx
import { useRouter } from "next/router";

export default function Learn() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#4b2a6f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background layers */}
      <div className="clouds"></div>
      <div className="mist"></div>

      {/* Navigation */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <button onClick={() => router.push("/gallery")} className="dreamy-button">
          ← Back to Gallery
        </button>
        <button onClick={() => router.push("/welcome")} className="dreamy-button">
          Welcome 🏠
        </button>
      </div>

      {/* Header */}
      <h1
        style={{
          color: "white",
          fontFamily: "Bodoni, serif",
          marginBottom: "2rem",
          fontSize: "3rem",
          fontWeight: "bold",
          position: "relative",
          zIndex: 2,
        }}
      >
        Learn 📖
      </h1>

      <p
        style={{
          color: "#ddd",
          fontSize: "1.5rem",
          maxWidth: "600px",
          textAlign: "center",
          lineHeight: "1.6",
          zIndex: 2,
          position: "relative",
        }}
      >
        Welcome to the <strong>Learn</strong> section.  
        This is where you can share resources, behind-the-scenes insights, or
        lessons about your music journey.  
        (Content coming soon!)
      </p>

      {/* Styles */}
      <style jsx>{`
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
