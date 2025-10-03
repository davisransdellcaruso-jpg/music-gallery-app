// pages/signup.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      const user = data?.user;
      if (user) {
        // Insert into profiles with full name + email
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: user.id,
            full_name: fullName,
            email: email,
          },
        ]);

        if (profileError) {
          console.error("Error saving profile:", profileError.message);
        }
      }

      // If confirmation email is required, no session is returned yet
      if (!data.session) {
        setMessage(
          "Check your email to confirm your account before logging in."
        );
      } else {
        router.push("/welcome");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* glow layers */}
      <div className="glow glow1" />
      <div className="glow glow2" />

      {/* clouds + mist */}
      <div className="clouds"></div>
      <div className="mist"></div>

      <form onSubmit={handleSignup} className="signup-form">
        <h1 className="signup-title">Create Account</h1>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="signup-input"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="signup-input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="signup-input"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="signup-input"
        />

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button type="submit" disabled={loading} className="dreamy-button">
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            #2a004f 0%,
            #4b2a6f 50%,
            #2e1a47 100%
          );
        }

        .signup-form {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 2rem;
          position: relative;
          z-index: 2;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .signup-title {
          text-align: center;
          margin-bottom: 2rem;
          color: #4b2a6f;
          font-family: Bodoni, serif;
          font-size: 2rem;
          font-weight: bold;
        }

        .signup-input {
          width: 100%;
          padding: 0.75rem;
          margin-bottom: 1rem;
          border-radius: 6px;
          border: 1px solid #ccc;
          background-color: khaki;
        }

        .error {
          color: red;
          margin-bottom: 1rem;
          text-align: center;
        }

        .success {
          color: green;
          margin-bottom: 1rem;
          text-align: center;
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.25rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          width: 100%;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.8);
        }

        /* glow */
        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.5;
          animation: pulse 12s ease-in-out infinite alternate;
        }
        .glow1 {
          width: 600px;
          height: 600px;
          top: -200px;
          left: -200px;
          background: rgba(168, 85, 247, 0.6);
        }
        .glow2 {
          width: 500px;
          height: 500px;
          bottom: -150px;
          right: -150px;
          background: rgba(99, 102, 241, 0.6);
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

        /* clouds + mist */
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
