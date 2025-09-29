// pages/success.tsx
import { useRouter } from "next/router";

export default function Success() {
  const router = useRouter();
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#4b2a6f",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        🎉 Thank you for your order!
      </h1>
      <p style={{ marginBottom: "1rem" }}>A receipt has been sent to your email.</p>
      <button
        onClick={() => router.push("/store")}
        style={{
          backgroundColor: "#6B4F82",
          color: "white",
          padding: "0.75rem 1.5rem",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Back to Store
      </button>
    </div>
  );
}
