import { useState, useEffect, useRef } from "react";
import { TypeAnimation } from "react-type-animation";
import { supabase } from "../lib/supabase";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!email) return setMessage("Please enter your email.");
    const { error } = await supabase.from("mailing_list").insert([{ email }]);
    if (error) {
      if (error.code === "23505") setMessage("You're already signed up 💜");
      else setMessage("Error: " + error.message);
    } else {
      setMessage("Thanks for subscribing 🌙");
      setEmail("");
    }
  };

  const newsletterText = `
When I first started writing music, it was mostly out of boredom. I enjoyed letting my thoughts pour onto the page and trying to mirror those feelings with the sounds I could make on a guitar.

It wasn’t until years later that I found the courage to share what I was doing. A few trusted friends heard my early songs and gave me the encouragement to keep going.

As my imagination grew, I began to picture a community of creatives — people working together, offering their gifts to build something that could sustain all of us in one way or another.

I’ve made plenty of mistakes along the way, some that have strained relationships or chipped away at my credibility as a leader. I ask for the grace and understanding that I am doing my best — trying to pave a path that looks different from what I’ve known.

My limitations are clear to me, and so I stay on the lookout for those who might happily extend a helping hand. There are a few folks in particular who have been with me since the beginning, and I’m deeply grateful for them. (You know who you are.)

I’m now working on my third studio album, Periwinkle — and it feels like an arrival of sorts. The album features eleven songs written by me and produced by Stucchi & The Shepherd — which includes my great friend and spirit brother, Giancarlo.

These songs trace a journey of getting to know myself through the creative process. I wear my heart on my sleeve, acknowledging my humanness while inviting others to do the same.

It’s a call to action for those who resonate: to join my tribe, to hold each other accountable, and to live in alignment with our values.

I believe we are all artists, and our greatest opportunity is to create something that makes our own lives — and someone else’s — a little better.

I’m ready to share. And I could use some help seeing it through to its fullest potential.

With gratitude,
– Davis
`;

  // 🎵 Autoplay on load (fade in)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const startAudio = async () => {
      try {
        audio.volume = 0;
        audio.muted = false;
        await audio.play();
        let vol = 0;
        const fadeIn = setInterval(() => {
          if (vol < 0.4) {
            vol += 0.02;
            audio.volume = vol;
          } else {
            clearInterval(fadeIn);
          }
        }, 200);
      } catch (err) {
        console.warn("Autoplay blocked by browser:", err);
      }
    };

    // Small timeout to let page mount before attempting playback
    const t = setTimeout(startAudio, 400);
    return () => clearTimeout(t);
  }, []);

  // 🎵 Fade out + stop when navigating away
  const stopMusicAndReturn = async () => {
    const audio = audioRef.current;
    if (audio) {
      let vol = audio.volume;
      const fadeOut = setInterval(() => {
        if (vol > 0.05) {
          vol -= 0.05;
          audio.volume = vol;
        } else {
          clearInterval(fadeOut);
          audio.pause();
          audio.currentTime = 0;
          window.location.href = "/gallery";
        }
      }, 100);
    } else {
      window.location.href = "/gallery";
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Courier+Prime&family=Trocchi&display=swap"
        rel="stylesheet"
      />
      <audio ref={audioRef} src="/newsletter-bg.mp3" loop preload="auto" />

      <div className="newsletter-page">
        {/* Navigation */}
        <div className="nav-top">
          <button onClick={stopMusicAndReturn} className="nav-button">
            ← Back to Gallery
          </button>
        </div>

        {/* Header */}
        <div className="newsletter-header">
          <h1>October Newsletter</h1>
          <h2>The Road to Periwinkle</h2>
        </div>

        {/* Body */}
        <div className="newsletter-layout">
          <div className="typewriter-container">
            <div className="paper" id="parchment">
              <TypeAnimation
  sequence={[newsletterText, 1000, () => setShowForm(true)]}
  wrapper="span"
  cursor={true}
  repeat={0}
  speed={54}
                style={{
                  whiteSpace: "pre-wrap",
                  color: "#2a004f",
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: "1.1rem",
                  lineHeight: "1.7rem",
                  textShadow: "0 0 6px rgba(255,255,255,0.2)",
                }}
              />
            </div>

            {showForm && (
              <form onSubmit={handleEmailSubmit} className="email-form fade-in">
                <input
                  type="email"
                  placeholder="Enter your email for next month’s issue"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="dreamy-button">
                  Subscribe ✨
                </button>
                {message && <p className="message">{message}</p>}
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .newsletter-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #2a004f, #4b2a6f 50%, #2e1a47 100%);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          animation: fadeIn 2s ease;
          font-family: "Trocchi", serif;
        }

        .nav-top {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          margin-bottom: 1.5rem;
        }

        .nav-button {
          font-family: "Trocchi", serif;
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

        .newsletter-header {
          text-align: center;
          margin-bottom: 2rem;
          color: #f9e8cc;
        }

        .newsletter-header h1 {
          font-size: 2.8rem;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .newsletter-header h2 {
          font-size: 1.5rem;
          font-weight: normal;
          color: #f3d6a6;
          font-style: italic;
        }

        .newsletter-layout {
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 1000px;
        }

        .paper {
          position: relative;
          background: url("https://www.transparenttextures.com/patterns/paper-fibers.png"),
            radial-gradient(
              circle at center,
              rgba(255, 245, 220, 0.95) 0%,
              rgba(255, 210, 150, 0.7) 60%,
              rgba(140, 90, 50, 0.6) 100%
            );
          background-blend-mode: overlay;
          border-radius: 10px;
          padding: 2rem;
          box-shadow: 0 0 25px rgba(255, 255, 255, 0.1);
          width: 100%;
          min-height: 400px;
          backdrop-filter: blur(6px);
          overflow: hidden;
        }

        .email-form {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .email-form input {
          width: 100%;
          max-width: 320px;
          padding: 0.8rem 1rem;
          border-radius: 8px;
          border: 1px solid #a78bfa;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          text-align: center;
          font-size: 1rem;
        }

        .dreamy-button {
          background-color: #aeb8fe;
          color: #2a004f;
          border: none;
          border-radius: 8px;
          padding: 0.6rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
          font-family: "Trocchi", serif;
          font-weight: bold;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }

        .dreamy-button:hover {
          background-color: #8f9efc;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.8);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .fade-in {
          animation: fadeIn 1.5s ease forwards;
        }
      `}</style>
    </>
  );
}
