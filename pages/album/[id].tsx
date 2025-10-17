// pages/album/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { supabase } from "../../lib/supabase";
import withAuth from "../../components/withAuth";
import { track } from "@vercel/analytics";

type Album = {
  id: string;
  title: string;
  year: number;
  cover_url: string;
};

type LyricLine = { time: number; line: string };

type Track = {
  id: string;
  album_id: string;
  title: string;
  audio_url: string;
  track_number: number;
  lyrics?: string;
  timed_lyrics?: LyricLine[];
  credits?: string;
};

function AlbumPage() {
  const router = useRouter();
  const { id } = router.query;

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [activeTab, setActiveTab] = useState<"lyrics" | "credits" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 🔒 unlock logic (kept for easy re-enable) — we'll bypass it for now
  const [unlocked, setUnlocked] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<HTMLParagraphElement[]>([]);

  // 👇 Always-public album IDs (kept for reference)
  const publicAlbumIds = [
    "1f4e2467-2ea1-4dcb-b65d-01bfd6096e14", // Dreamin on Paris
    "998d0b78-709c-480d-bf5c-63469f832c6c", // The Fool
    "fd1a5c47-45ab-449f-ae72-ce7b9a953a7d", // Wavis (EP)
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

        // -------------------------
        // BYPASS: Always mark unlocked
        // -------------------------
        // to restore gating later: remove the next line and uncomment the checks below
        setUnlocked(true);

        // If you prefer album-based whitelist (publicAlbumIds), you can use:
        // if (publicAlbumIds.includes(albumData.id)) setUnlocked(true);
      }

      const { data: trackData } = await supabase
        .from("tracks")
        .select("*")
        .eq("album_id", id)
        .order("track_number", { ascending: true });

      if (trackData) setTracks(trackData as Track[]);

      // -------------------------
      // ORIGINAL UNLOCK CHECK (COMMENTED OUT)
      // kept here so you can re-enable gating quickly in the future
      /*
      // 🔒 Unlock check only for non-public albums
      if (albumData && !publicAlbumIds.includes(albumData.id)) {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("total_spent")
            .eq("id", user.id)
            .single();

          const { data: unlock } = await supabase
            .from("album_unlocks")
            .select("required_amount")
            .eq("album_id", id)
            .single();

          if (unlock) {
            setRequiredAmount(unlock.required_amount);
            if (profile && profile.total_spent >= unlock.required_amount) {
              setUnlocked(true);
            }
          }
        }
      }
      */
      // -------------------------

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleEnded = () => {
    // Auto-advance
    nextTrack(true);
  };

  // reset lyric refs on track change
  useEffect(() => {
    lineRefs.current = [];
  }, [currentIndex]);

  const currentTrack = tracks[currentIndex];

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

  // ⌨️ Keyboard shortcuts (keep your originals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!audioRef.current) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          audioRef.current.currentTime = Math.max(
            audioRef.current.currentTime - 5,
            0
          );
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
  }, [volume, duration]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      await audioRef.current.play();
      setIsPlaying(true);
      // 🎯 track event: play
      track("Track Played", {
        album: album?.title,
        albumId: album?.id,
        track: currentTrack?.title,
        trackNumber: currentTrack?.track_number,
      });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      // 🎯 track event: pause
      track("Track Paused", {
        album: album?.title,
        albumId: album?.id,
        track: currentTrack?.title,
        trackNumber: currentTrack?.track_number,
      });
    }
  };

  const nextTrack = async (autoPlay = true) => {
    if (!tracks.length) return;
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentIndex(nextIndex);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.src = tracks[nextIndex].audio_url;
      if (autoPlay) {
        await audioRef.current.play();
        setIsPlaying(true);
        // 🎯 track event: next
        track("Next Track", {
          album: album?.title,
          albumId: album?.id,
          track: tracks[nextIndex]?.title,
          trackNumber: tracks[nextIndex]?.track_number,
        });
      } else {
        setIsPlaying(false);
      }
    }
  };

  const prevTrack = async (autoPlay = true) => {
    if (!tracks.length) return;
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.src = tracks[prevIndex].audio_url;
      if (autoPlay) {
        await audioRef.current.play();
        setIsPlaying(true);
        // 🎯 track event: previous
        track("Previous Track", {
          album: album?.title,
          albumId: album?.id,
          track: tracks[prevIndex]?.title,
          trackNumber: tracks[prevIndex]?.track_number,
        });
      } else {
        setIsPlaying(false);
      }
    }
  };

  if (loading) return <div style={{ color: "white" }}>Loading album…</div>;
  if (!album || tracks.length === 0)
    return <div style={{ color: "white" }}>Album not found</div>;

  // NOTE: lock screen route is bypassed — kept here for reference if you want to restore it later
  if (!unlocked && !publicAlbumIds.includes(album.id)) {
    return (
      <div className="album-page trocchi">
        <link
          href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
          rel="stylesheet"
        />
        {/* dreamy background layers */}
        <div className="glow glow1" />
        <div className="glow glow2" />
        <div className="clouds"></div>
        <div className="mist"></div>

        {/* locked content */}
        <div
          style={{
            textAlign: "center",
            marginTop: "5rem",
            position: "relative",
            zIndex: 2,
          }}
        >
          <h1 className="album-title">{album.title}</h1>

          {requiredAmount !== null ? (
            <p className="lock-text">Spend ${requiredAmount / 100} to unlock this material.</p>
          ) : (
            <p className="lock-text">This album is locked.</p>
          )}

          <button
            onClick={() => router.push("/store")}
            className="dreamy-button"
            style={{ marginTop: "2rem", padding: "1rem 2rem", fontSize: "1.2rem", borderRadius: "8px" }}
          >
            Store 🛒
          </button>
        </div>

        <style jsx>{`
          .lock-text { font-size: 1.8rem; margin-top: 1.5rem; color: white; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="album-page trocchi">
      <link
        href="https://fonts.googleapis.com/css2?family=Trocchi&display=swap"
        rel="stylesheet"
      />

      {/* glow layers */}
      <div className="glow glow1" />
      <div className="glow glow2" />

      {/* clouds + mist */}
      <div className="clouds"></div>
      <div className="mist"></div>

      {/* Top navigation */}
      <div className="nav-bar">
        <button onClick={() => router.push("/gallery")} className="dreamy-button">
          ← Back to Gallery
        </button>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={() => router.push("/store")} className="dreamy-button">Store 🛒</button>
          <button onClick={() => router.push("/learn")} className="dreamy-button">Learn 📖</button>
        </div>
      </div>

      <h1 className="album-title">
        {album.title} <span className="album-year">({album.year})</span>
      </h1>

      {/* 🎵 Spinning Vinyl (spins only while playing) */}
      <div className={`vinyl ${isPlaying ? "spin" : ""}`} title="Album">
        <div className="vinyl-grooves" />
        <div className="vinyl-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={album.cover_url} alt={album.title} className="vinyl-label" />
        </div>
      </div>

      <div className="track-list">
        {tracks.map((track, i) => (
          <div
            key={track.id}
            onClick={async () => {
              setCurrentIndex(i);
              setCurrentTime(0);
              if (audioRef.current) {
                audioRef.current.src = track.audio_url;
                await audioRef.current.play();
                setIsPlaying(true);
              }
            }}
            className={`track-item ${i === currentIndex ? "active" : ""}`}
          >
            {track.track_number}. {track.title}
          </div>
        ))}
      </div>

      {currentTrack && (
        <>
          <h3>
            {currentTrack.track_number}. {currentTrack.title}
          </h3>

          {/* Hidden audio element */}
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

          {/* Custom controls */}
          <div className="custom-player">
            {/* ⏮ Prev */}
            <button onClick={() => prevTrack(true)} className="next-button" title="Previous">
              ⏮
            </button>

            {/* ⏯ Play / Pause */}
            <button onClick={togglePlay} className="play-button" aria-label="Play/Pause">
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="icon">
                  <path fill="currentColor" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="icon">
                  <path fill="currentColor" d="M5 3l14 9-14 9V3z" />
                </svg>
              )}
            </button>

            {/* ⏭ Next */}
            <button onClick={() => nextTrack(true)} className="next-button" title="Next">
              ⏭
            </button>

            {/* Scrubber + Time */}
            <div className="scrubber-container">
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
                style={{
                  background: `linear-gradient(90deg, #a78bfa ${
                    (currentTime / (duration || 1)) * 100
                  }%, #4b2a6f ${(currentTime / (duration || 1)) * 100}%)`,
                }}
              />
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Volume */}
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

            {/* Hover shortcut hint */}
            <div className="shortcut-hint">
              ⌨️ <b>Space</b> = Play/Pause • <b>←/→</b> = Seek • <b>↑/↓</b> = Volume
            </div>
          </div>
        </>
      )}

      {(currentTrack?.lyrics || currentTrack?.credits) && (
        <div className="tab-container">
          <div className="tab-buttons">
            {currentTrack?.lyrics && (
              <button
                onClick={() =>
                  setActiveTab(activeTab === "lyrics" ? null : "lyrics")
                }
                className={`dreamy-button ${activeTab === "lyrics" ? "active-tab" : ""}`}
              >
                Lyrics
              </button>
            )}
            {currentTrack?.credits && (
              <button
                onClick={() =>
                  setActiveTab(activeTab === "credits" ? null : "credits")
                }
                className={`dreamy-button ${activeTab === "credits" ? "active-tab" : ""}`}
              >
                Credits
              </button>
            )}
          </div>

          {activeTab === "lyrics" && currentTrack?.lyrics && (
            <div ref={lyricsContainerRef} className="lyrics-box">
              {currentTrack.timed_lyrics ? (
                currentTrack.timed_lyrics.map((line, i) => (
                  <p
                    key={i}
                    ref={(el) => { if (el) lineRefs.current[i] = el; }}
                    className={`lyric-line ${i === currentLyricIndex ? "active-lyric" : ""}`}
                  >
                    {line.line}
                  </p>
                ))
              ) : (
                <p style={{ whiteSpace: "pre-wrap", color: "#ddd", fontSize: "1.5rem" }}>
                  {currentTrack.lyrics}
                </p>
              )}
            </div>
          )}

          {activeTab === "credits" && currentTrack?.credits && (
            <div className="credits-box">
              <p style={{ fontSize: "1.5rem", lineHeight: "1.6" }}>
                {currentTrack.credits}
              </p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .trocchi { font-family: "Trocchi", serif; }

        .album-page {
          min-height: 100vh;
          padding: 2rem;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #2a004f 0%, #4b2a6f 50%, #2e1a47 100%);
        }

        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.5;
          animation: pulse 12s ease-in-out infinite alternate;
        }
        .glow1 { width: 600px; height: 600px; top: -200px; left: -200px; background: rgba(168, 85, 247, 0.6); }
        .glow2 { width: 500px; height: 500px; bottom: -150px; right: -150px; background: rgba(99, 102, 241, 0.6); animation-delay: 6s; }
        @keyframes pulse { from { transform: scale(1); opacity: 0.4; } to { transform: scale(1.2); opacity: 0.7); } }

        .clouds {
          position: absolute; top: 0; left: 0; width: 200%; height: 100%;
          background: url("/clouds.png") repeat-x; background-size: cover;
          opacity: 0.25; animation: drift 60s linear infinite;
        }
        .mist {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
          pointer-events: none;
        }
        @keyframes drift { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none; border-radius: 6px;
          padding: 0.5rem 1rem; cursor: pointer;
          font-size: 1rem; font-weight: bold;
          transition: background-color 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease;
          font-family: "Trocchi", serif;
        }
        .dreamy-button:hover { background-color: #8f9efc; box-shadow: 0 0 15px rgba(175, 184, 254, 0.8); transform: translateY(-1px); }
        .active-tab { background-color: #8f9efc; }

        .nav-bar {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          position: relative; z-index: 2;
        }

        .album-title {
          font-size: 2.5rem;
          font-weight: bold;
          margin-top: 1rem;
          text-align: center;
          position: relative; z-index: 2;
        }
        .album-year { font-size: 2rem; font-weight: normal; }

        /* 🎵 Vinyl */
        .vinyl {
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #111 0%, #000 100%);
          position: relative;
          box-shadow: 0 15px 35px rgba(0,0,0,0.6);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .vinyl:hover {
          transform: scale(1.04);
          box-shadow: 0 18px 40px rgba(200, 180, 255, 0.35);
        }
        .vinyl-grooves {
          position: absolute; inset: 0; border-radius: 50%;
          background: repeating-radial-gradient(
            circle,
            rgba(255,255,255,0.15) 0px,
            rgba(255,255,255,0.15) 1px,
            transparent 2px,
            transparent 3px
          );
          opacity: 0.7;
        }
        .vinyl-center {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 130px; height: 130px;
          border-radius: 50%; overflow: hidden;
          border: 2px solid #222; z-index: 2;
          background: #111;
        }
        .vinyl-label { width: 100%; height: 100%; object-fit: cover; display: block; }

        .spin { animation: spin 12s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .track-list {
          margin-bottom: 2rem; position: relative; z-index: 2;
        }
        .track-item {
          cursor: pointer; margin: 0.5rem 0; font-size: 2rem;
        }
        .track-item.active { font-weight: bold; text-decoration: underline; }
        .track-item:hover { filter: drop-shadow(0 0 10px rgba(200, 180, 255, 0.7)); }

        .custom-player {
          display: flex; align-items: center; gap: 1rem;
          background: rgba(75, 42, 111, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 0.5rem 1rem;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
          width: 100%; max-width: 500px; position: relative;
        }
        .play-button, .next-button {
          background: #aeb8fe; border: none; border-radius: 50%;
          width: 50px; height: 50px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #2a004f;
          transition: background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        }
        .play-button:hover, .next-button:hover {
          background: #8f9efc; transform: scale(1.1);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.8);
        }
        .icon { width: 24px; height: 24px; }

        .scrubber-container { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
        .scrubber {
          -webkit-appearance: none; width: 100%; height: 6px; border-radius: 5px;
          background: linear-gradient(90deg, #a78bfa 0%, #4b2a6f 0%); outline: none; cursor: pointer;
        }
        .scrubber::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: #fff; border: 2px solid #a78bfa; box-shadow: 0 0 8px rgba(167,139,250,1);
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }
        .scrubber::-webkit-slider-thumb:hover { transform: scale(1.2); box-shadow: 0 0 15px rgba(167,139,250,1); }
        .scrubber::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; border: 2px solid #a78bfa; box-shadow: 0 0 8px rgba(167,139,250,1);
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }
        .scrubber::-moz-range-thumb:hover { transform: scale(1.2); box-shadow: 0 0 15px rgba(167,139,250,1); }

        .time-display { font-size: 0.8rem; color: #ccc; text-align: center; }

        .volume { width: 80px; accent-color: #aeb8fe; cursor: pointer; }

        .tab-container { margin-top: 2rem; width: 100%; max-width: 500px; position: relative; z-index: 2; }
        .tab-buttons { display: flex; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
        .lyrics-box, .credits-box {
          text-align: center; max-height: 300px; overflow-y: auto; width: 100%;
          padding: 1rem; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; background: rgba(0,0,0,0.2);
        }
        .lyric-line { color: #aaa; font-size: 1.5rem; margin: 0.3rem 0; transition: all 0.3s; }
        .lyric-line.active-lyric { color: #fff; font-weight: bold; font-size: 1.8rem; }

        .shortcut-hint {
          position: absolute; bottom: -2.2rem; left: 50%; transform: translateX(-50%);
          background: rgba(75, 42, 111, 0.9); color: #fff; padding: 0.4rem 0.8rem;
          border-radius: 6px; font-size: 0.8rem; white-space: nowrap;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.6);
          opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        .custom-player:hover .shortcut-hint { opacity: 1; }
      `}</style>
    </div>
  );
}

export default withAuth(AlbumPage);
