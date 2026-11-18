// lib/signupTracking.ts
// Two small jobs for the email signup:
//
// 1. Remember where a visitor came from. Bio links carry ?src=ig, ?src=tt,
//    a QR code could carry ?src=qr, and so on. The first source seen on
//    this device is kept, so it still counts if they browse around first.
//
// 2. Count each step of the signup (popup shown, dismissed, email given,
//    email confirmed) in the Supabase `signup_events` table, so you can
//    see where people drop off at /signup-stats.

import { isNoTrack } from "./noTrack";

const SOURCE_KEY = "dc_src";
const VISITOR_KEY = "dc_visitor_id"; // same id the listener map uses

export type SignupEvent = "shown" | "dismissed" | "button";

// Letters, numbers, dashes and underscores only, at most 32 characters
export function cleanSource(value: unknown): string | null {
  const s = String(value ?? "").toLowerCase().trim();
  return /^[a-z0-9_-]{1,32}$/.test(s) ? s : null;
}

// Call once per page load (done in _app). Saves ?src= if there is one.
export function captureSource(): void {
  if (typeof window === "undefined") return;
  try {
    const src = cleanSource(new URLSearchParams(window.location.search).get("src"));
    if (src && !localStorage.getItem(SOURCE_KEY)) {
      localStorage.setItem(SOURCE_KEY, src);
    }
  } catch {}
}

// For pages that are a source in themselves (ad pages): use this name
// unless a ?src= link or an earlier visit already said where they came from
export function setSourceIfUnknown(value: string): void {
  const src = cleanSource(value);
  if (!src || typeof window === "undefined") return;
  try {
    if (!localStorage.getItem(SOURCE_KEY)) {
      localStorage.setItem(SOURCE_KEY, urlSource() ?? src);
    }
  } catch {}
}

// Where this visitor came from, or "direct" if no link said
// (Falls back to ?src= in the address bar: a page's first events can fire
// before _app has saved it, and those used to be counted as "direct".)
export function getSource(): string {
  try {
    return (
      cleanSource(localStorage.getItem(SOURCE_KEY)) ??
      urlSource() ??
      "direct"
    );
  } catch {
    return urlSource() ?? "direct";
  }
}

function urlSource(): string | null {
  try {
    return cleanSource(new URLSearchParams(window.location.search).get("src"));
  } catch {
    return null;
  }
}

function visitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Fire-and-forget: never slows the page or shows an error to a visitor
export function logSignupEvent(event: SignupEvent, page = ""): void {
  if (typeof window === "undefined" || isNoTrack()) return;
  try {
    fetch("/api/signup-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        source: getSource(),
        visitorId: visitorId(),
        page: page || window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

// Lets any button on the site open the signup popup
export const OPEN_SIGNUP_EVENT = "dc:open-signup";

export function openSignup(): void {
  try {
    window.dispatchEvent(new Event(OPEN_SIGNUP_EVENT));
  } catch {}
}
