// lib/redditPixel.ts
// Small wrapper around the Reddit Pixel (rdt) so components can fire
// custom conversion events without worrying about SSR or a missing pixel.

declare global {
  interface Window {
    rdt?: (...args: unknown[]) => void;
  }
}

function newConversionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Fire a Reddit custom conversion event.
 * Names are case-sensitive and max 64 characters.
 * Only the 20 most recent custom event names show in Events Manager,
 * so keep the set of names small and consistent.
 */
export function trackRedditCustom(
  customEventName: string,
  extra: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined" || typeof window.rdt !== "function") return;
  window.rdt("track", "Custom", {
    customEventName,
    conversionId: newConversionId(),
    ...extra,
  });
}

/** Standard PageVisit, for client-side route changes. */
export function trackRedditPageVisit(): void {
  if (typeof window === "undefined" || typeof window.rdt !== "function") return;
  window.rdt("track", "PageVisit");
}