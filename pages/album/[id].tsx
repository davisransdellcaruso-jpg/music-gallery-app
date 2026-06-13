// pages/album/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { supabase } from "../../lib/supabase";
import { track } from "@vercel/analytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Album = {
  id: string;
  title: string;
  year: number;
  cover_url: string;
  release_note?: string;
};

type LyricLine = { time: number; line: string };

type TrackT = {
  id: string;
  album_id: string;
  title: string;
  audio_url: string;
  track_number: number;
  is_available?: boolean;
  lyrics?: string;
  timed_lyrics?: LyricLine[];
  credits?: string;
};

function AlbumPage() {
  const router = useRouter();
  const { id } = router.query;

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<TrackT[]>([]);
  const availableTracks = tracks.filter((t) => t.is_available);

  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(1);
  const [activeTab, setActiveTab] = useState<"lyrics" | "credits" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [unlocked, setUnlocked] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<HTMLParagraphElement[]>([]);

  const publicAlbumIds = [
    "1f4e2467-2ea1-4dcb-b65d-01bfd6096e14",
    "998d0b78-709c-480d-bf5c-63469f832c6c",
    "fd1a5c47-45ab-449f-ae72-ce7b9a953a7d",
  ];

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchData = async () => {
      const { data: albumData } = await supabase
        .from("albums")
        .select("*")
        .eq("id", id)
        .single();

      if (albumData) {
        setAlbum(albumData as Album);
        setUnlocked(true);
      }

      const { data: trackData } = await supabase
        .from("tracks")
        .select("*")
        .eq("album_id", id)
        .order("track_number", { ascending: true });

      if (trackData) setTracks(trackData as TrackT[]);

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleEnded = () => {
    nextTrack(true);
  };

  useEffect(() => {
    lineRefs.current = [];
  }, [currentIndex]);

  const currentTrack = availableTracks[currentIndex];

  const currentLyricIndex =
    currentTrack?.timed_lyrics?.findIndex(
      (l, i) =>
        l.time <= currentTime &&
        (i === currentTrack.timed_lyrics!.length - 1 ||
          currentTrack.timed_lyrics![i + 1].time > currentTime)
    ) ?? -1;

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

  async function logTrackPlay(trackId: string) {
    try {
      await fetch("/api/log-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId }),
      });
    } catch (err) {
      console.error("Error logging play:", err);
    }
  }

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      await audioRef.current.play();
      setIsPlaying(true);

      track("Track Played", {
        album: album?.title,
        albumId: album?.id,
        track: currentTrack?.title,
        trackNumber: currentTrack?.track_number,
      });

      if (currentTrack?.id) logTrackPlay(currentTrack.id);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);

      track("Track Paused", {
        album: album?.title,
        albumId: album?.id,
        track: currentTrack?.title,
        trackNumber: currentTrack?.track_number,
      });
    }
  };

  const nextTrack = async (autoPlay = true) => {
    if (!availableTracks.length) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= availableTracks.length) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    setCurrentIndex(nextIndex);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.src = availableTracks[nextIndex].audio_url;
      if (autoPlay) {
        await audioRef.current.play();
        setIsPlaying(true);

        track("Next Track", {
          album: album?.title,
          albumId: album?.id,
          track: availableTracks[nextIndex]?.title,
          trackNumber: availableTracks[nextIndex]?.track_number,
        });

        if (availableTracks[nextIndex]?.id) logTrackPlay(availableTracks[nextIndex].id);
      }
    }
  };

  const prevTrack = async (autoPlay = true) => {
    if (!availableTracks.length) return;

    const prevIndex =
      currentIndex === 0 ? availableTracks.length - 1 : currentIndex - 1;

    setCurrentIndex(prevIndex);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.src = availableTracks[prevIndex].audio_url;
      if (autoPlay) {
        await audioRef.current.play();
        setIsPlaying(true);

        track("Previous Track", {
          album: album?.title,
          albumId: album?.id,
          track: availableTracks[prevIndex]?.title,
          trackNumber: availableTracks[prevIndex]?.track_number,
        });

        if (availableTracks[prevIndex]?.id) logTrackPlay(availableTracks[prevIndex].id);
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!audioRef.current) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0);
          setCurrentTime(audioRef.current.currentTime);
          break;
        case "ArrowRight":
          audioRef.current.currentTime = Math.min(
            audioRef.current.currentTime + 5,
            duration
          );
          setCurrentTime(audioRef.current.currentTime);
          break;
        case "ArrowUp":
          e.preventDefault();
          {
            const volUp = Math.min(volume + 0.1, 1);
            audioRef.current.volume = volUp;
            setVolume(volUp);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          {
            const volDown = Math.max(volume - 0.1, 0);
            audioRef.current.volume = volDown;
            setVolume(volDown);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, duration, currentTrack?.id]);

  if (loading) return <div style={{ color: "#e6e3dc", background: "#7b7fc4", minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "'Trocchi', serif" }}>Loading album…</div>;
  if (!album) return <div style={{ color: "#e6e3dc", background: "#7b7fc4", minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "'Trocchi', serif" }}>Album not found</div>;

  if (!unlocked && !publicAlbumIds.includes(album.id)) {
    return (
      <div className="album-page">
        <link
          href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
          rel="stylesheet"
        />

        <div className="lock-wrap">
          <h1 className="page-title">{album.title}</h1>

          {requiredAmount !== null ? (
            <p className="lock-text">
              Spend ${requiredAmount / 100} to unlock this material.
            </p>
          ) : (
            <p className="lock-text">This album is locked.</p>
          )}

          <button onClick={() => router.push("/store")} className="outline-button">
            Store
          </button>
        </div>

        <style jsx>{`
          .album-page {
            min-height: 100vh;
            background: #7b7fc4;
            font-family: "Trocchi", serif;
            color: #e6e3dc;
            display: grid;
            place-items: center;
            padding: 3rem 2rem;
          }
          .lock-wrap {
            text-align: center;
            max-width: 520px;
          }
          .page-title {
            letter-spacing: 0.18em;
            font-weight: 400;
            margin: 0 0 1rem;
          }
          .lock-text {
            color: #d4d1eb;
            margin: 0.5rem 0 2rem;
          }
          .outline-button {
            border: 1px solid #c9a24d;
            background: transparent;
            color: #c9a24d;
            padding: 0.6rem 1.4rem;
            letter-spacing: 0.1em;
            cursor: pointer;
            font-family: "Trocchi", serif;
            border-radius: 999px;
            -webkit-appearance: none;
            appearance: none;
          }
          .outline-button:hover {
            background: rgba(201, 162, 77, 0.1);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="album-page">
      <link
        href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
        rel="stylesheet"
      />

      {/* Top navigation */}
      <div className="top-row">
        <button onClick={() => router.push("/gallery")} className="text-link">
          ← Back to Gallery
        </button>
      </div>

      {/* Title */}
      <div className="title-block">
        <h1 className="page-title">
          {album.title} <span className="year">({album.year})</span>
        </h1>

        {album.release_note && <p className="release-note">{album.release_note}</p>}

        <div className="underline" />
      </div>

      {/* Vinyl (spins only while playing) */}
      <div className={`vinyl ${isPlaying ? "spin" : ""}`} title="Album">
        <div className="vinyl-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={album.cover_url} alt={album.title} className="vinyl-label" />
        </div>
      </div>

      {/* Track list */}
      <div className="track-list">
        {tracks.map((t) => {
          const isAvailable = !!t.is_available;
          const isCurrent = currentTrack?.id === t.id;

          return (
            <button
              key={t.id}
              className={`track-row ${isCurrent ? "current" : ""}`}
              disabled={!isAvailable}
              onClick={async () => {
                if (!isAvailable) return;
                const idx = availableTracks.findIndex((x) => x.id === t.id);
                if (idx === -1) return;

                setCurrentIndex(idx);
                setCurrentTime(0);

                if (audioRef.current) {
                  audioRef.current.src = t.audio_url;
                  await audioRef.current.play();
                  setIsPlaying(true);
                  if (t.id) logTrackPlay(t.id);
                }
              }}
            >
              <span className="track-left">
                <span className="track-num">{t.track_number}.</span>
                <span className="track-title">{t.title}</span>
              </span>

              {!isAvailable && <span className="track-right">Unavailable</span>}
            </button>
          );
        })}
      </div>

      {/* Player + tabs */}
      {currentTrack && (
        <>
          <audio
            ref={audioRef}
            src={currentTrack.audio_url}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {
              if (audioRef.current) setDuration(audioRef.current.duration);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            autoPlay
            style={{ display: "none" }}
          />

          <div className="player">
            <button onClick={() => prevTrack(true)} className="icon-btn" title="Previous">
              ⏮
            </button>

            <button onClick={togglePlay} className="icon-btn main" aria-label="Play/Pause">
              {isPlaying ? "⏸" : "▶"}
            </button>

            <button onClick={() => nextTrack(true)} className="icon-btn" title="Next">
              ⏭
            </button>

            <div className="scrubber-wrap">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  const newTime = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }}
                className="scrubber"
              />
              <div className="time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                const newVolume = Number(e.target.value);
                setVolume(newVolume);
                if (audioRef.current) audioRef.current.volume = newVolume;
              }}
              className="volume"
              title="Volume"
            />
          </div>

          {(currentTrack?.lyrics || currentTrack?.credits) && (
            <div className="tabs">
              <div className="tab-buttons">
                {currentTrack?.lyrics && (
                  <button
                    onClick={() => setActiveTab(activeTab === "lyrics" ? null : "lyrics")}
                    className={`outline-button ${activeTab === "lyrics" ? "active" : ""}`}
                  >
                    Lyrics
                  </button>
                )}
                {currentTrack?.credits && (
                  <button
                    onClick={() => setActiveTab(activeTab === "credits" ? null : "credits")}
                    className={`outline-button ${activeTab === "credits" ? "active" : ""}`}
                  >
                    Credits
                  </button>
                )}
              </div>

              {activeTab === "lyrics" && currentTrack?.lyrics && (
                <div ref={lyricsContainerRef} className="box">
                  {currentTrack.timed_lyrics ? (
                    currentTrack.timed_lyrics.map((line, i) => (
                      <p
                        key={i}
                        ref={(el) => {
                          if (el) lineRefs.current[i] = el;
                        }}
                        className={`lyric ${i === currentLyricIndex ? "active-lyric" : ""}`}
                      >
                        {line.line}
                      </p>
                    ))
                  ) : (
                    <p className="plain-text">{currentTrack.lyrics}</p>
                  )}
                </div>
              )}

              {activeTab === "credits" && currentTrack?.credits && (
                <div className="box">
                  <p className="plain-text">{currentTrack.credits}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        *, *::before, *::after {
          box-sizing: border-box;
        }

        .album-page {
          min-height: 100vh;
          padding: 3rem 2rem 4rem;
          background: #7b7fc4;
          font-family: "Trocchi", serif;
          color: #e6e3dc;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
          overflow-x: hidden;
          -webkit-text-size-adjust: 100%;
        }

        .top-row {
          width: 100%;
          max-width: 960px;
          display: flex;
          justify-content: flex-start;
        }

        .text-link {
          background: transparent;
          border: none;
          color: #e6e3dc;
          letter-spacing: 0.08em;
          cursor: pointer;
          padding: 0.25rem 0;
          font-family: "Trocchi", serif;
          font-size: 1rem;
          -webkit-tap-highlight-color: transparent;
        }
        .text-link:hover {
          text-decoration: underline;
        }

        .title-block {
          text-align: center;
          max-width: 960px;
          width: 100%;
        }

        .page-title {
          margin: 0;
          font-weight: 400;
          letter-spacing: 0.12em;
          font-size: 2rem;
        }

        .year {
          color: #d4d1eb;
          font-weight: 400;
          letter-spacing: 0.08em;
        }

        .release-note {
          margin: 0.75rem auto 0;
          max-width: 640px;
          color: #d4d1eb;
          font-style: italic;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .underline {
          width: 60px;
          height: 1px;
          margin: 1.5rem auto 0;
          background: #c9a24d;
        }

        .vinyl {
          width: min(320px, 82vw);
          height: min(320px, 82vw);
          border-radius: 50%;
          background: #111;
          position: relative;
        }

        .vinyl-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(130px, 33vw);
          height: min(130px, 33vw);
          border-radius: 50%;
          overflow: hidden;
        }

        .vinyl-label {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .spin {
          animation: spin 14s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .track-list {
          width: 100%;
          max-width: 640px;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          margin-top: 0.5rem;
        }

        .track-row {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(230, 227, 220, 0.25);
          border-radius: 14px;
          padding: 0.85rem 1rem;
          cursor: pointer;
          color: #e6e3dc;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          text-align: left;
          font-family: "Trocchi", serif;
          font-size: 1rem;
          transition: border-color 0.2s ease, background 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          -webkit-appearance: none;
          appearance: none;
        }

        .track-row:hover {
          border-color: rgba(201, 162, 77, 0.7);
          background: rgba(201, 162, 77, 0.06);
        }

        .track-row:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .track-row.current {
          border-color: rgba(201, 162, 77, 0.9);
          background: rgba(201, 162, 77, 0.08);
        }

        .track-left {
          display: inline-flex;
          gap: 0.6rem;
          align-items: baseline;
          min-width: 0;
        }

        .track-num {
          color: #d4d1eb;
          flex: 0 0 auto;
        }

        .track-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-right {
          color: #d4d1eb;
          font-style: italic;
          font-size: 0.9rem;
          flex: 0 0 auto;
        }

        .player {
          width: 100%;
          max-width: 720px;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          border: 1px solid rgba(230, 227, 220, 0.25);
          border-radius: 16px;
          padding: 0.9rem 1rem;
          background: rgba(0, 0, 0, 0.12);
        }

        .icon-btn {
          border: 1px solid rgba(201, 162, 77, 0.6);
          background: transparent;
          color: #c9a24d;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          cursor: pointer;
          font-family: "Trocchi", serif;
          display: grid;
          place-items: center;
          transition: background 0.2s ease;
          flex: 0 0 auto;
          -webkit-tap-highlight-color: transparent;
          -webkit-appearance: none;
          appearance: none;
        }

        .icon-btn:hover {
          background: rgba(201, 162, 77, 0.1);
        }

        .icon-btn.main {
          width: 52px;
          height: 52px;
          border-color: rgba(201, 162, 77, 0.85);
        }

        .scrubber-wrap {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-width: 0;
        }

        .scrubber {
          width: 100%;
          accent-color: #c9a24d;
          cursor: pointer;
        }

        .time {
          font-size: 0.8rem;
          color: #d4d1eb;
          text-align: center;
        }

        .volume {
          width: 110px;
          accent-color: #c9a24d;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .tabs {
          width: 100%;
          max-width: 720px;
          margin-top: 0.75rem;
        }

        .tab-buttons {
          display: flex;
          justify-content: center;
          gap: 0.8rem;
          margin-bottom: 1rem;
        }

        .outline-button {
          border: 1px solid #c9a24d;
          background: transparent;
          color: #c9a24d;
          padding: 0.55rem 1.2rem;
          letter-spacing: 0.1em;
          cursor: pointer;
          font-family: "Trocchi", serif;
          font-size: 16px;
          border-radius: 999px;
          transition: background 0.2s ease, color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          -webkit-appearance: none;
          appearance: none;
        }

        .outline-button:hover {
          background: rgba(201, 162, 77, 0.1);
        }

        .outline-button.active {
          background: rgba(201, 162, 77, 0.14);
        }

        .box {
          border: 1px solid rgba(230, 227, 220, 0.2);
          border-radius: 16px;
          padding: 1.2rem 1.25rem;
          background: rgba(0, 0, 0, 0.12);
          max-height: 360px;
          overflow-y: auto;
        }

        .plain-text {
          margin: 0;
          white-space: pre-wrap;
          color: #e6e3dc;
          line-height: 1.7;
          font-size: 1rem;
          text-align: center;
        }

        .lyric {
          margin: 0.35rem 0;
          color: #d4d1eb;
          font-size: 1rem;
          line-height: 1.6;
          text-align: center;
          transition: color 0.2s ease;
        }

        .active-lyric {
          color: #e6e3dc;
        }

        @media (max-width: 520px) {
          .album-page {
            padding: 2.25rem 1.1rem 3rem;
            gap: 2rem;
          }

          .page-title {
            font-size: 1.6rem;
          }

          .player {
            flex-wrap: wrap;
            justify-content: center;
          }

          .volume {
            width: 100%;
            max-width: 220px;
          }
        }
      `}</style>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}

export default AlbumPage;