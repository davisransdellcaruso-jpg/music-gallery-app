import { useRouter } from "next/router";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { supabase } from "../../lib/supabase";
import withAuth from "../../components/withAuth"; // ⬅️ import wrapper

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
  credits?: string;
};

type Comment = {
  id: string;
  album_id: string;
  content: string;
  created_at: string;
};

function AlbumPage() {
  const router = useRouter();
  const { id } = router.query;

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<"lyrics" | "credits" | null>(null);

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

      const { data: commentData } = await supabase
        .from("comments")
        .select("*")
        .eq("album_id", id)
        .order("created_at", { ascending: true });
      if (commentData) setComments(commentData as Comment[]);

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

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    const { data, error } = await supabase
      .from("comments")
      .insert([{ album_id: id, content: newComment }])
      .select()
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      setNewComment("");
    }
  };

  if (loading) return <div style={{ color: "white" }}>Loading album…</div>;
  if (!album || tracks.length === 0)
    return <div style={{ color: "white" }}>Album not found</div>;

  return (
    <div className="album-page">
      {/* Background layers */}
      <div className="clouds"></div>
      <div className="mist"></div>

      {/* Top navigation */}
      <div className="nav-bar">
        <button onClick={() => router.push("/gallery")} className="dreamy-button">
          ← Back to Gallery
        </button>
        <button onClick={() => window.open("/store", "_blank")} className="dreamy-button">
          Store 🛒
        </button>
      </div>

      {/* Album title */}
      <h1 className="album-title">
        {album.title} <span className="album-year">({album.year})</span>
      </h1>

      {/* Album cover */}
      <img src={album.cover_url} alt={album.title} className="album-cover" />

      {/* Track list */}
      <div className="track-list">
        {tracks.map((track, i) => (
          <div
            key={track.id}
            onClick={() => {
              setCurrentIndex(i);
              setCurrentTime(0);
              audioRef.current?.play();
            }}
            className={`track-item ${i === currentIndex ? "active" : ""}`}
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
            className="audio-player"
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            autoPlay
          />
        </>
      )}

      {/* Tabs for Lyrics / Credits */}
      {(currentTrack?.lyrics || currentTrack?.credits) && (
        <div className="tab-container">
          <div className="tab-buttons">
            {currentTrack?.lyrics && (
              <button
                onClick={() =>
                  setActiveTab(activeTab === "lyrics" ? null : "lyrics")
                }
                className={`dreamy-button ${
                  activeTab === "lyrics" ? "active-tab" : ""
                }`}
              >
                Lyrics
              </button>
            )}
            {currentTrack?.credits && (
              <button
                onClick={() =>
                  setActiveTab(activeTab === "credits" ? null : "credits")
                }
                className={`dreamy-button ${
                  activeTab === "credits" ? "active-tab" : ""
                }`}
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
                    ref={(el) => {
                      if (el) lineRefs.current[i] = el;
                    }}
                    className={`lyric-line ${
                      i === currentLyricIndex ? "active-lyric" : ""
                    }`}
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

      {/* Comments */}
      <div className="comments">
        <h3>Comments</h3>
        <div className="comments-list">
          {comments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            comments.map((c) => (
              <p key={c.id} className="comment-text" style={{ marginBottom: "0.5rem" }}>
                {c.content}
              </p>
            ))
          )}
        </div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="comment-input"
        />
        <button onClick={handleAddComment} className="dreamy-button">
          Post Comment
        </button>
      </div>

      {/* Styles */}
      <style jsx>{`
        .album-page {
          min-height: 100vh;
          background-color: #4b2a6f;
          padding: 2rem;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          position: relative;
          overflow: hidden;
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

        .nav-bar {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .dreamy-button {
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
        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(175, 184, 254, 0.8);
        }
        .active-tab {
          background-color: #8f9efc;
        }

        .album-title {
          font-family: Bodoni, serif;
          font-size: 2.5rem;
          font-weight: bold;
          margin-top: 1rem;
          text-align: center;
          position: relative;
          z-index: 2;
        }
        .album-year {
          font-size: 2rem;
          font-weight: normal;
        }

        .album-cover {
          width: 300px;
          height: 300px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 2;
        }
        .album-cover:hover {
          filter: drop-shadow(0 0 15px rgba(200, 180, 255, 0.7));
        }

        .track-list {
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }
        .track-item {
          cursor: pointer;
          margin: 0.5rem 0;
          font-size: 2rem;
        }
        .track-item.active {
          font-weight: bold;
          text-decoration: underline;
        }
        .track-item:hover {
          filter: drop-shadow(0 0 10px rgba(200, 180, 255, 0.7));
        }

        .audio-player {
          width: 300px;
          position: relative;
          z-index: 2;
        }

        .tab-container {
          margin-top: 2rem;
          width: 100%;
          max-width: 500px;
          position: relative;
          z-index: 2;
        }
        .tab-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .lyrics-box,
        .credits-box {
          text-align: center;
          max-height: 300px;
          overflow-y: auto;
          width: 100%;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.2);
        }
        .lyric-line {
          color: #aaa;
          font-size: 1.5rem;
          margin: 0.3rem 0;
          transition: all 0.3s;
        }
        .lyric-line.active-lyric {
          color: #fff;
          font-weight: bold;
          font-size: 1.8rem;
        }

        .credits-box {
          font-size: 1.5rem;
          line-height: 1.6;
        }

        .comments {
          margin-top: 2rem;
          width: 100%;
          max-width: 500px;
          position: relative;
          z-index: 2;
        }
        .comments-list {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 8px;
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 1rem;
        }
        /* Only change: make comment text closer to track size (2rem) */
        .comment-text {
          font-size: 2rem;
          line-height: 1.3;
        }
        .comment-input {
          width: 100%;
          border-radius: 6px;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 1.25rem; /* slightly larger input for balance */
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

// ⬅️ wrap withAuth to protect the page
export default withAuth(AlbumPage);
