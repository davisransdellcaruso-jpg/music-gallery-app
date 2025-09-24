// pages/gallery.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";

type Album = {
  id: string;
  title: string;
  year: number;
  cover_url: string;
};

export default function Gallery() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      const { data, error } = await supabase.from("albums").select("*");
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
        backgroundColor: "#4b2a6f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
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
          color: "white",
          fontFamily: "Bodoni, serif",
          marginBottom: "2rem",
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
              transition: "transform 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-20px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(-10px)")
            }
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
            <p style={{ color: "white", margin: "0.25rem 0" }}>{album.year}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
