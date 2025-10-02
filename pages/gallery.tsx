// pages/gallery.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import withAuth from "../components/withAuth";
import Image from "next/image";

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
      if (error) {
        console.error(error);
      } else {
        setAlbums((data as Album[]) || []);
      }
      setLoading(false);
    };
    fetchAlbums();
  }, []);

  if (loading) return <div style={{ color: "white" }}>Loading albums…</div>;

  return (
    <div className="gallery-page">
      {/* Top navigation */}
      <div className="nav-bar">
        <button onClick={() => router.push("/welcome")} className="nav-button">
          ← Back to Welcome
        </button>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={() => router.push("/store")} className="nav-button">
            Store 🛒
          </button>
          <button onClick={() => router.push("/learn")} className="nav-button">
            Learn 📖
          </button>
        </div>
      </div>

      {/* Title block */}
      <div className="title-block">
        <div className="glow-behind"></div>
        <h1 className="brand-title">wavis</h1>
        <div className="underline"></div>
        <p className="tagline">art &amp; story</p>
      </div>

      {/* Album grid */}
      <div className="album-grid">
        {albums.map((album) => (
          <div
            key={album.id}
            onClick={() => router.push(`/album/${album.id}`)}
            className="album-card"
          >
            <Image
              src={album.cover_url}
              alt={album.title}
              width={250}
              height={250}
              className="album-image"
            />
            <h2 className="album-title">{album.title}</h2>
            <p className="album-year">({album.year})</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .gallery-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          position: relative;
        }

        .nav-bar {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .nav-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          padding: 0.5rem 1rem;
          color: #fff;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .nav-button:hover {
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
        }

        .title-block {
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
        }

        .glow-behind {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -65%);
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 180, 120, 0.6) 0%,
            rgba(255, 140, 100, 0.3) 40%,
            transparent 70%
          );
          filter: blur(60px);
          z-index: 0;
          animation: pulse 8s ease-in-out infinite alternate;
        }

        @keyframes pulse {
          from {
            transform: translate(-50%, -65%) scale(1);
            opacity: 0.7;
          }
          to {
            transform: translate(-50%, -65%) scale(1.15);
            opacity: 1;
          }
        }

        .brand-title {
          font-size: 3.5rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: "Eurostile", "Futura", "Helvetica Neue", sans-serif;
          position: relative;
          z-index: 1;
        }

        .underline {
          width: 120px;
          height: 3px;
          margin: 0.5rem auto 1rem;
          background: linear-gradient(to right, #ff6b4a, #ffb347);
          border-radius: 2px;
          position: relative;
          z-index: 1;
        }

        .tagline {
          font-style: italic;
          font-size: 1.2rem;
          color: #ddd;
          font-family: "Didot", "Bodoni MT", serif;
          position: relative;
          z-index: 1;
        }

        .album-grid {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 3rem;
          position: relative;
          z-index: 1;
          max-width: 1200px;
          width: 100%;
        }

        .album-card {
          cursor: pointer;
          text-align: center;
          transition: transform 0.3s, box-shadow 0.3s;
          border-radius: 12px;
          padding: 0.5rem;
        }
        .album-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 0 20px rgba(175, 184, 254, 0.7);
        }

        .album-image {
          border-radius: 12px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
          object-fit: cover;
        }

        .album-title {
          color: white;
          font-family: "Bodoni, serif";
          margin: 0.5rem 0 0 0;
        }
        .album-year {
          color: white;
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}

export default withAuth(Gallery);
