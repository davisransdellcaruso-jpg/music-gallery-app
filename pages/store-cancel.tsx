// pages/store-cancel.tsx
import { useRouter } from "next/router";

export default function StoreCancel() {
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
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        ❌ Checkout canceled
      </h1>
      <p style={{ marginBottom: "1.5rem", maxWidth: "400px", textAlign: "center" }}>
        No worries — your cart is still waiting. You can return to the store and
        complete your purchase anytime.
      </p>
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
