// components/NavBar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import React from "react";

const NavBar: React.FC = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/welcome");
  };

  return (
    <nav
      style={{
        position: "absolute",
        top: "1rem",
        right: "1rem",
        display: "flex",
        gap: "1rem",
        zIndex: 10,
      }}
    >
      <Link href="/store" target="_blank">
        <button className="nav-button">Store 🛒</button>
      </Link>
      <Link href="/lessons">
        <button className="nav-button">Learn 📚</button>
      </Link>
      <button onClick={handleLogout} className="nav-button">
        Logout
      </button>

      <style jsx>{`
        .nav-button {
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
        .nav-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.8);
        }
      `}</style>
    </nav>
  );
};

export default NavBar;
