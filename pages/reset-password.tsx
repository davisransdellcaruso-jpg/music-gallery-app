// pages/reset-password.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pull base site URL from env (different in dev vs prod)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Detect recovery mode from Supabase email link
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        setMode("reset");
      }
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the password reset link.");
      setTimeout(() => router.push("/welcome"), 3000);
    }

    setLoading(false);
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) throw updateError;

  setMessage("Password updated! Redirecting to login…");
  setTimeout(() => router.push("/welcome"), 3000);
} catch (err: any) {
  setError(err.message || "Something went wrong while updating password.");
}

    setLoading(false);
  };

  const canSubmitNewPassword =
  newPassword.trim().length >= 6 &&   // 👈 enforce minimum length
  confirmPassword.trim().length >= 6 &&
  newPassword === confirmPassword &&
  !loading;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#4b2a6f",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="clouds"></div>
      <div className="mist"></div>

      <form
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "8px",
          padding: "2rem",
          position: "relative",
          zIndex: 2,
        }}
        onSubmit={mode === "request" ? handleRequestReset : handleNewPassword}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            color: "#4b2a6f",
            fontFamily: "Bodoni, serif",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        >
          {mode === "request" ? "Reset Password" : "Set New Password"}
        </h1>

        {mode === "request" && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: "khaki",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="dreamy-button"
              style={{ width: "100%" }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        )}

        {mode === "reset" && (
          <>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: "khaki",
              }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: "khaki",
              }}
            />
            <button
              type="submit"
              disabled={!canSubmitNewPassword}
              className="dreamy-button"
              style={{ width: "100%" }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}

        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        {message && <p style={{ color: "green", marginTop: "1rem" }}>{message}</p>}
      </form>

      <style jsx>{`
        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.25rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        .dreamy-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dreamy-button:hover:enabled {
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
