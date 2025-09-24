// pages/album/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { supabase } from "@/lib/supabase";

type Album = {
  id: string;
  title: string;
  year: number;
  cover_url: string;
};

type LyricLine = {
  time: number;
  line: string;
};

type Track = {
  id: string;
  album_id: string;
  title: string;
  audio_url: string;
  track_number: number;
  lyrics?: string;
  timed_lyrics?: LyricLine[];
};

export default function AlbumPage() {
  const router = useRouter();
  const { id } = router.query;

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<HTMLParagraphElement[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: albumData } = await supabase
        .from("albums")
        .select("*")
        .eq("id", id)
        .single();
      if (albumData) setAlbum(albumData as Album);

      const { data: trackData } = await supabase
        .from("tracks")
        .select("*")
        .eq("album_id", id)
        .order("track_number", { ascending: true });

      if (trackData) setTracks(trackData as Track[]);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleEnded = () => {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentTime(0);
    }
  };

  useEffect(() => {
    lineRefs.current = [];
  }, [currentIndex]);

  const currentTrack = tracks[currentIndex];

  const currentLyricIndex = currentTrack?.timed_lyrics
    ? currentTrack.timed_lyrics.findIndex(
        (l, i) =>
          l.time <= currentTime &&
          (i === currentTrack.timed_lyrics!.length - 1 ||
            currentTrack.timed_lyrics![i + 1].time > currentTime)
      )
    : -1;

  useLayoutEffect(() => {
    if (
      currentLyricIndex >= 0 &&
      lineRefs.current[currentLyricIndex] &&
      lyricsContainerRef.current
    ) {
      const lineEl = lineRefs.current[currentLyricIndex]!;
      const container = lyricsContainerRef.current!;
      const lineCenter =
        lineEl.offsetTop - container.clientHeight / 2 + lineEl.clientHeight / 2;
      container.scrollTo({ top: lineCenter, behavior: "smooth" });
    }
  }, [currentLyricIndex]);

  if (loading) return <div style={{ color: "white" }}>Loading album…</div>;
  if (!album || tracks.length === 0)
    return <div style={{ color: "white" }}>Album not found</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#4b2a6f",
        padding: "2rem",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2rem",
      }}
    >
      {/* Top navigation bar */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => router.push("/gallery")}
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
          ← Back to Gallery
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
          fontFamily: "Bodoni, serif",
          fontSize: "2rem",
          marginTop: "1rem",
        }}
      >
        dav.wav gallery
      </h1>

      {/* Album cover */}
      <img
        src={album.cover_url}
        alt={album.title}
        style={{
          width: "300px",
          height: "300px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      />
      <h2 style={{ fontFamily: "Bodoni, serif", fontSize: "1.5rem" }}>
        {album.title}
      </h2>
      <p>{album.year}</p>

      {/* Track list */}
      <div style={{ marginBottom: "2rem" }}>
        {tracks.map((track, i) => (
          <div
            key={track.id}
            onClick={() => {
              setCurrentIndex(i);
              setCurrentTime(0);
              audioRef.current?.play();
            }}
            style={{
              cursor: "pointer",
              margin: "0.3rem 0",
              fontWeight: i === currentIndex ? "bold" : "normal",
              textDecoration: i === currentIndex ? "underline" : "none",
            }}
          >
            {track.track_number}. {track.title}
          </div>
        ))}
      </div>

      {/* Audio player */}
      {currentTrack && (
        <>
          <h3>
            {currentTrack.track_number}. {currentTrack.title}
          </h3>
          <audio
            ref={audioRef}
            controls
            src={currentTrack.audio_url}
            style={{ width: "300px" }}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            autoPlay
          />
        </>
      )}

      {/* Lyrics toggle */}
      {currentTrack?.lyrics && (
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            style={{
              backgroundColor: "#6B4F82",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginBottom: "1rem",
            }}
          >
            {showLyrics ? "Hide Lyrics" : "Show Lyrics"}
          </button>

          {showLyrics && (
            <div
              ref={lyricsContainerRef}
              style={{
                textAlign: "center",
                maxHeight: "250px",
                overflowY: "auto",
                width: "100%",
                maxWidth: "400px",
                padding: "1rem",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              {currentTrack.timed_lyrics ? (
                currentTrack.timed_lyrics.map((line, i) => (
                  <p
                    key={i}
                    ref={(el) => {
                      if (el) lineRefs.current[i] = el;
                    }}
                    style={{
                      color: i === currentLyricIndex ? "#fff" : "#aaa",
                      fontWeight: i === currentLyricIndex ? "bold" : "normal",
                      fontSize: i === currentLyricIndex ? "1.2rem" : "1rem",
                      transition: "all 0.3s",
                      margin: "0.3rem 0",
                    }}
                  >
                    {line.line}
                  </p>
                ))
              ) : (
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "#ddd",
                    maxWidth: "400px",
                  }}
                >
                  {currentTrack.lyrics}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
