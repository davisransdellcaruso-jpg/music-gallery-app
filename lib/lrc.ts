// Parse and build LRC-style timed lyrics.
// Format: one line per lyric, prefixed with [mm:ss.xx], e.g.
//   [00:12.40]I wake up slow on a Sunday
//   [00:16.85]Light through the window
// Lines with no timestamp are treated as plain (unsynced) lyrics.

export type LyricLine = { time: number | null; text: string };

const TIME_TAG = /\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]/g;
const META_TAG = /^\[[a-z]+:.*\]$/i; // [ar:Davis Caruso], [ti:Song] etc.

export function parseLyrics(raw?: string | null): { lines: LyricLine[]; synced: boolean } {
  if (!raw || !raw.trim()) return { lines: [], synced: false };

  const out: LyricLine[] = [];
  let synced = false;

  for (const rawLine of raw.replace(/\r/g, '').split('\n')) {
    if (META_TAG.test(rawLine.trim())) continue;
    const times: number[] = [];
    const text = rawLine
      .replace(TIME_TAG, (_m, mm: string, ss: string) => {
        times.push(parseInt(mm, 10) * 60 + parseFloat(ss));
        return '';
      })
      .trim();

    if (times.length) {
      synced = true;
      times.forEach((t) => out.push({ time: t, text }));
    } else {
      out.push({ time: null, text });
    }
  }

  if (synced) {
    const timed = out.filter((l) => l.time !== null) as { time: number; text: string }[];
    timed.sort((a, b) => a.time - b.time);
    return { lines: timed, synced: true };
  }
  // Plain lyrics: trim leading/trailing blank lines
  while (out.length && !out[0].text) out.shift();
  while (out.length && !out[out.length - 1].text) out.pop();
  return { lines: out, synced: false };
}

/** Index of the line that should be highlighted at time t (seconds), or -1 before the first line. */
export function activeIndex(lines: LyricLine[], t: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if ((lines[mid].time ?? Infinity) <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

export function formatTag(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `[${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}]`;
}

export function toLrc(lines: { time: number; text: string }[]): string {
  return lines.map((l) => `${formatTag(l.time)}${l.text}`).join('\n');
}
