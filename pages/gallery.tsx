// pages/gallery.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import withAuth from "../components/withAuth";
import NavBar from "../components/NavBar"; // ⬅️ import the NavBar

type Album = {
  id: string;
  title: string;
  year: number;
  cover_url: string;
};

function Gallery() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .order("year", { ascending: true });
      if (error) console.error(error);
      else setAlbums(data || []);
      setLoading(false);
    };
    fetchAlbums();
  }, []);

  if (loading) return <div style={{ color: "white" }}>Loading albums…</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#4b2a6f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      {/* Animated clouds */}
      <div className="clouds"></div>
      <div className="mist"></div>

      {/* Top navigation bar */}
      <NavBar />

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
        dav.wav gallery
      </h1>

      {/* Album grid */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "3rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        {albums.map((album) => (
          <div
            key={album.id}
            onClick={() => router.push(`/album/${album.id}`)}
            style={{
              cursor: "pointer",
              textAlign: "center",
              transform: "translateY(-10px)",
              transition: "transform 0.3s, box-shadow 0.3s",
              borderRadius: "12px",
              padding: "0.5rem",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-20px)";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(175, 184, 254, 0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(-10px)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <img
              src={album.cover_url}
              alt={album.title}
              style={{
                width: "250px",
                height: "250px",
                objectFit: "cover",
                borderRadius: "12px",
                boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
              }}
            />
            <h2
              style={{
                color: "white",
                fontFamily: "Bodoni, serif",
                margin: "0.5rem 0 0 0",
              }}
            >
              {album.title}
            </h2>
            <p style={{ color: "white", margin: "0.25rem 0" }}>({album.year})</p>
          </div>
        ))}
      </div>

      {/* Styles */}
      <style jsx>{`
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

export default withAuth(Gallery);
