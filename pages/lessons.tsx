// pages/lessons.tsx
import { useRouter } from "next/router";

export default function Lessons() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#4b2a6f",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "Bodoni, serif",
        padding: "2rem",
      }}
    >
      {/* Top navigation bar */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={() => router.push("/welcome")}
          style={{
            backgroundColor: "#6B4F82",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          ← Back to Welcome
        </button>

        <button
          onClick={() => window.open("/store", "_blank")}
          style={{
            backgroundColor: "#6B4F82",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Store 🛒
        </button>
      </div>

      {/* Header */}
      <h1
        style={{
          fontSize: "3rem", // ⬅ bigger
          fontWeight: "bold",
          fontFamily: "Bodoni, serif",
          marginBottom: "1.5rem",
        }}
      >
        dav.wav gallery
      </h1>

      {/* Content */}
      <h2 style={{ fontSize: "1.5rem" }}>Learn with Davis 🎥</h2>
      <p style={{ marginTop: "1rem", textAlign: "center", maxWidth: "600px" }}>
        This is where video lessons will go. For now, it’s a placeholder page.
      </p>
    </div>
  );
}
