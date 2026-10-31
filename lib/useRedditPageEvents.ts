// lib/useRedditPageEvents.ts
// Call once in pages/_app.tsx.
// Next.js navigates client-side, so the pixel's base code only sees the
// FIRST page load. This hook fires PageVisit on every later route change,
// plus a custom event when someone lands on the map, story or flyer pages.

import { useEffect } from "react";
import { useRouter } from "next/router";
import { trackRedditCustom, trackRedditPageVisit } from "./redditPixel";

// Exact paths -> custom event names. Edit these to match your site.
const PAGE_EVENTS: Record<string, string> = {
  "/welcome-map": "Map View",
  "/story": "Updates View",
  "/morning-movement": "Morning Movement View",
};

// If flyers live under a shared route (e.g. /flyers/morning-movement),
// any flyer page fires "Flyer View" with the flyer's slug attached.
const FLYER_PREFIX = "/events/";

function pathOf(url: string): string {
  const path = url.split("?")[0].split("#")[0];
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function fireForPath(path: string): void {
  const name = PAGE_EVENTS[path];
  if (name) {
    trackRedditCustom(name);
    return;
  }
  if (path.startsWith(FLYER_PREFIX)) {
    const flyer = path.slice(FLYER_PREFIX.length);
    trackRedditCustom("Flyer View", { flyer });
  }
}

export function useRedditPageEvents(): void {
  const router = useRouter();

  useEffect(() => {
    // Initial load: base code already sent PageVisit, so only the custom event.
    fireForPath(pathOf(router.asPath));

    const onRouteChange = (url: string) => {
      trackRedditPageVisit();
      fireForPath(pathOf(url));
    };

    router.events.on("routeChangeComplete", onRouteChange);
    return () => router.events.off("routeChangeComplete", onRouteChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
