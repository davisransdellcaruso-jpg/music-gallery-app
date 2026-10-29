// lib/useRedditPageEvents.ts
// Call once in pages/_app.tsx.
// Next.js navigates client-side, so the pixel's base code only sees the
// FIRST page load. This hook fires PageVisit on every later route change,
// plus a custom event when someone lands on the map or story pages.

import { useEffect } from "react";
import { useRouter } from "next/router";
import { trackRedditCustom, trackRedditPageVisit } from "./redditPixel";

// Edit these paths/names to match your site.
const PAGE_EVENTS: Record<string, string> = {
  "/welcome-map": "Map View",
  "/story": "Updates View",
};

function pathOf(url: string): string {
  return url.split("?")[0].split("#")[0];
}

export function useRedditPageEvents(): void {
  const router = useRouter();

  useEffect(() => {
    // Initial load: base code already sent PageVisit, so only the custom event.
    const first = PAGE_EVENTS[pathOf(router.asPath)];
    if (first) trackRedditCustom(first);

    const onRouteChange = (url: string) => {
      trackRedditPageVisit();
      const name = PAGE_EVENTS[pathOf(url)];
      if (name) trackRedditCustom(name);
    };

    router.events.on("routeChangeComplete", onRouteChange);
    return () => router.events.off("routeChangeComplete", onRouteChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}