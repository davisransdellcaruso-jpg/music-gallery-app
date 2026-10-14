// lib/releases.ts
//
// To add or change a release, edit this list. The site plays the newest
// track whose releaseDate is today or earlier (Detroit time), so each song
// takes over automatically at midnight Eastern on its release date.

export type Release = {
  title: string;
  audioUrl: string;
  releaseDate: string; // YYYY-MM-DD
};

const BASE =
  "https://bzllhepdcooxjekehkvc.supabase.co/storage/v1/object/public";

export const RELEASES: Release[] = [
  {
    title: "Peace Of Mind",
    audioUrl: `${BASE}/Login%20page%20video/Peace%20Of%20Mind.wav`,
    releaseDate: "2026-09-16",
  },
  {
    title: "Change My Plans",
    audioUrl: `${BASE}/tracks/Change%20My%20Plans.mp3`,
    releaseDate: "2026-09-30",
  },
  {
    title: "Whoever You Wanna Be",
    audioUrl: `${BASE}/tracks/Whoever%20You%20Wanna%20Be.mp3`,
    releaseDate: "2026-10-14",
  },
  {
    title: "Denim Blues",
    audioUrl: `${BASE}/tracks/Denim%20Blues%20mp3.mp3`,
    releaseDate: "2026-10-28",
  },
  {
    title: "Smitten",
    audioUrl: `${BASE}/tracks/Smitten.mp3`,
    releaseDate: "2026-11-11",
  },
  {
    title: "Second Chances",
    audioUrl: `${BASE}/tracks/Second%20Chances.mp3`,
    releaseDate: "2026-11-25",
  },
  {
    title: "Levity",
    audioUrl: `${BASE}/tracks/Levity.mp3`,
    releaseDate: "2026-12-09",
  },
  {
    title: "Cruel",
    audioUrl: `${BASE}/tracks/Cruel.mp3`,
    releaseDate: "2026-12-23",
  },
];

export function getCurrentRelease(): Release {
  // Today's date in Detroit (YYYY-MM-DD), so releases flip at midnight
  // Eastern regardless of the visitor's own timezone.
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Detroit",
  });

  const released = RELEASES.filter((r) => r.releaseDate <= today).sort(
    (a, b) => a.releaseDate.localeCompare(b.releaseDate)
  );

  // Newest released track, or the earliest one if nothing is out yet.
  return released[released.length - 1] ?? RELEASES[0];
}