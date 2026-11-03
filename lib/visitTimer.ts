// lib/visitTimer.ts
// Remembers when someone first arrived on the site during this visit, so
// the welcome popup can wait for total time on the site rather than time
// on one page. "This visit" lasts until they close the tab.

const ARRIVAL_KEY = "dc_arrived_at";

// Call on every page load. Only the first call in a visit is kept.
export function markArrival(): number {
  const now = Date.now();
  try {
    const saved = Number(sessionStorage.getItem(ARRIVAL_KEY));
    if (saved > 0 && saved <= now) return saved;
    sessionStorage.setItem(ARRIVAL_KEY, String(now));
  } catch {}
  return now;
}

// How long it has been since they first arrived this visit
export function msOnSite(): number {
  return Date.now() - markArrival();
}