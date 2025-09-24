// pages/welcome.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";

export default function Welcome() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const handleAuth = async (
    e: React.FormEvent,
    destination: "gallery" | "lessons"
  ) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error && error.message.includes("Invalid login credentials")) {
        const signupRes = await supabase.auth.signUp({ email, password });
        if (signupRes.error) throw signupRes.error;

        setMessage("Please check your email to confirm your account.");
        setUnconfirmedEmail(email);
        setLoading(false);
        return;
      }

      if (error) throw error;

      if (data.user?.email_confirmed_at) {
        if (!stayLoggedIn && data.session) {
          localStorage.removeItem("supabase.auth.token");
          sessionStorage.setItem(
            "supabase.auth.token",
            JSON.stringify(data.session)
          );
        }
        router.push(`/${destination}`);
      } else {
        setMessage("Please confirm your email before accessing the gallery.");
        setUnconfirmedEmail(email);
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unconfirmedEmail) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
    });
    if (error) setError(error.message);
    else setMessage("Confirmation email resent. Please check your inbox.");
  };

  const credentialsFilled = email.trim() !== "" && password.trim() !== "";

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
      }}
    >
      <form
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "2rem",
        }}
      >
        {/* Header */}
        <h1
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            color: "#4b2a6f",
            fontFamily: "Bodoni, serif",
          }}
        >
          dav.wav gallery
        </h1>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        {/* Stay logged in */}
        <label
          style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}
        >
          <input
            type="checkbox"
            checked={stayLoggedIn}
            onChange={(e) => setStayLoggedIn(e.target.checked)}
            style={{ marginRight: "0.5rem" }}
          />
          Keep me logged in
        </label>

        {/* Error/Message */}
        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}
        {message && <p style={{ color: "green", marginBottom: "1rem" }}>{message}</p>}

        {/* Resend confirmation */}
        {unconfirmedEmail && (
          <button
            type="button"
            onClick={handleResend}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              backgroundColor: "#ccc",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Resend Confirmation Email
          </button>
        )}

        {/* Music */}
        <button
          type="submit"
          disabled={!credentialsFilled || loading}
          onClick={(e) => handleAuth(e, "gallery")}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: credentialsFilled ? "#6B4F82" : "#aaa",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: credentialsFilled ? "pointer" : "not-allowed",
            marginBottom: "1rem",
          }}
        >
          {loading ? "Loading..." : "Music"}
        </button>

        {/* Learn */}
        <button
          type="submit"
          disabled={!credentialsFilled || loading}
          onClick={(e) => handleAuth(e, "lessons")}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: credentialsFilled ? "#6B4F82" : "#aaa",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: credentialsFilled ? "pointer" : "not-allowed",
            marginBottom: "1rem",
          }}
        >
          {loading ? "Loading..." : "Learn"}
        </button>

        {/* Store */}
        <button
          type="button"
          onClick={() => window.open("/store", "_blank")}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#6B4F82",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Store
        </button>
      </form>
    </div>
  );
}
