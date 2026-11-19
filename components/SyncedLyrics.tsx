import { useEffect, useMemo, useRef, useState } from 'react';
import { activeIndex, parseLyrics } from '../lib/lrc';

type Props = {
  /** Ref to the room's <audio> element */
  audioRef: { current: HTMLAudioElement | null };
  /** LRC text (timed) or plain lyrics. Nothing renders if empty. */
  lyrics?: string | null;
  /** Nudge all timings, in seconds (+ shows lines earlier) */
  offset?: number;
  /** Spanish/English label switch, matches the rest of the site */
  lang?: 'en' | 'es';
};

const LABELS = {
  en: { show: 'Lyrics', hide: 'Hide lyrics' },
  es: { show: 'Letra', hide: 'Ocultar letra' },
};

export default function SyncedLyrics({ audioRef, lyrics, offset = 0.15, lang = 'en' }: Props) {
  const { lines, synced } = useMemo(() => parseLyrics(lyrics), [lyrics]);
  const [current, setCurrent] = useState(-1);
  const [open, setOpen] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const lastIdx = useRef(-1);
  const userScrollUntil = useRef(0);

  // Remember show/hide choice per browser
  useEffect(() => {
    try {
      const v = localStorage.getItem('room-lyrics-open');
      if (v !== null) setOpen(v === '1');
    } catch {}
  }, []);
  const toggle = () => {
    setOpen((o) => {
      try { localStorage.setItem('room-lyrics-open', o ? '0' : '1'); } catch {}
      return !o;
    });
  };

  // Follow the audio clock
  useEffect(() => {
    const audio = audioRef.current;
    lastIdx.current = -1;
    setCurrent(-1);
    if (!audio || !synced) return;

    let raf = 0;
    const update = () => {
      const i = activeIndex(lines, audio.currentTime + offset);
      if (i !== lastIdx.current) {
        lastIdx.current = i;
        setCurrent(i);
      }
    };
    const tick = () => { update(); raf = requestAnimationFrame(tick); };
    const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    const stop = () => { cancelAnimationFrame(raf); update(); };

    audio.addEventListener('play', start);
    audio.addEventListener('pause', stop);
    audio.addEventListener('seeked', update);
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('ended', stop);
    if (!audio.paused) start(); else update();

    return () => {
      cancelAnimationFrame(raf);
      audio.removeEventListener('play', start);
      audio.removeEventListener('pause', stop);
      audio.removeEventListener('seeked', update);
      audio.removeEventListener('loadedmetadata', update);
      audio.removeEventListener('ended', stop);
    };
  }, [audioRef, lines, synced, offset]);

  // Keep the active line centered (unless the listener is scrolling themselves)
  useEffect(() => {
    const box = boxRef.current;
    const el = current >= 0 ? lineRefs.current[current] : null;
    if (!box || !open) return;
    if (Date.now() < userScrollUntil.current) return;
    const top = el ? el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2 : 0;
    box.scrollTo({ top, behavior: 'smooth' });
  }, [current, open]);

  if (!lines.length) return null;

  const pauseAutoScroll = () => { userScrollUntil.current = Date.now() + 4000; };
  const seekTo = (t: number | null) => {
    const audio = audioRef.current;
    if (audio && t !== null) {
      audio.currentTime = Math.max(0, t - offset + 0.01);
      userScrollUntil.current = 0;
    }
  };

  return (
    <section className="lyrics">
      <button className="toggle" onClick={toggle} aria-expanded={open}>
        {open ? LABELS[lang].hide : LABELS[lang].show}
      </button>

      {open && (
        <div
          ref={boxRef}
          className={`box ${synced ? 'synced' : 'plain'}`}
          onWheel={pauseAutoScroll}
          onTouchMove={pauseAutoScroll}
        >
          {synced && <div className="pad" />}
          {lines.map((l, i) => {
            const state = !synced ? '' : i === current ? 'active' : i < current ? 'past' : 'future';
            return (
              <p
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className={`line ${state} ${l.text ? '' : 'gap'}`}
                onClick={synced ? () => seekTo(l.time) : undefined}
              >
                {l.text || (synced ? '♪' : ' ')}
              </p>
            );
          })}
          {synced && <div className="pad" />}
        </div>
      )}

      <style jsx>{`
        .lyrics {
          --lyric-glow: var(--lyric-glow-color, #b48cff);
          --lyric-warm: var(--lyric-warm-color, #e8a15c);
          width: 100%;
          max-width: 560px;
          margin: 1.25rem auto 0;
          text-align: center;
        }
        .toggle {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: rgba(255, 255, 255, 0.8);
          border-radius: 999px;
          padding: 0.35rem 1rem;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .toggle:hover { border-color: var(--lyric-glow); color: #fff; }
        .box {
          margin-top: 0.9rem;
          height: 46vh;
          max-height: 420px;
          overflow-y: auto;
          scrollbar-width: none;
          -webkit-mask-image: linear-gradient(transparent, #000 18%, #000 82%, transparent);
          mask-image: linear-gradient(transparent, #000 18%, #000 82%, transparent);
        }
        .box::-webkit-scrollbar { display: none; }
        .box.plain { -webkit-mask-image: none; mask-image: none; text-align: center; }
        .pad { height: 40%; }
        .line {
          margin: 0;
          padding: 0.45rem 0.5rem;
          font-size: clamp(1.05rem, 2.6vw, 1.45rem);
          line-height: 1.35;
          color: rgba(255, 255, 255, 0.85);
          transition: color 0.35s ease, opacity 0.35s ease, transform 0.35s ease, text-shadow 0.35s ease;
        }
        .synced .line { cursor: pointer; opacity: 0.38; }
        .synced .line:hover { opacity: 0.7; }
        .line.past { opacity: 0.28; }
        .line.active {
          opacity: 1;
          color: #fff;
          transform: scale(1.04);
          text-shadow: 0 0 18px var(--lyric-glow), 0 0 2px var(--lyric-warm);
        }
        .line.gap { color: var(--lyric-warm); }
        .plain .line { font-size: 1rem; padding: 0.15rem 0; opacity: 0.9; }
        @media (prefers-reduced-motion: reduce) {
          .line { transition: none; }
          .line.active { transform: none; }
        }
      `}</style>
    </section>
  );
}
