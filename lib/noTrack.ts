// lib/noTrack.ts
// "Don't count me" switch for your own phone / laptop.
//
// Open any page once with ?notrack=1 (e.g. daviscaruso.com/s/pom-reddit?notrack=1)
// on each browser you use. From then on that browser is left out of every stat:
// Vercel Analytics, the Reddit pixel, listener dots, the signup funnel
// (/signup-stats, /ad-stats) and ad streaming taps. ?notrack=0 turns counting back on.
//
// Saved two ways: localStorage for the trackers that run in the browser, and a
// cookie so the server can skip its own logging (ad taps, signups, confirmations).

export const NO_TRACK_KEY = "dc_no_track";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Reads ?notrack=1 / ?notrack=0 from the address bar and saves the choice
function syncFromUrl(): void {
  try {
    const flag = new URLSearchParams(window.location.search).get("notrack");
    if (flag === "1") localStorage.setItem(NO_TRACK_KEY, "1");
    if (flag === "0") {
      localStorage.removeItem(NO_TRACK_KEY);
      document.cookie = `${NO_TRACK_KEY}=; path=/; max-age=0`;
    }
    if (localStorage.getItem(NO_TRACK_KEY)) {
      document.cookie = `${NO_TRACK_KEY}=1; path=/; max-age=${ONE_YEAR}; samesite=lax; secure`;
    }
  } catch {}
}

// Browser side: true on your own devices
export function isNoTrack(): boolean {
  if (typeof window === "undefined") return false;
  syncFromUrl();
  try {
    if (localStorage.getItem(NO_TRACK_KEY)) return true;
  } catch {}
  try {
    return new RegExp(`(?:^|;\\s*)${NO_TRACK_KEY}=1`).test(document.cookie);
  } catch {
    return false;
  }
}

// Server side (API routes / getServerSideProps): true when the request comes from your own devices
export function isNoTrackRequest(req: { cookies?: Partial<Record<string, string>> }): boolean {
  return req.cookies?.[NO_TRACK_KEY] === "1";
}
