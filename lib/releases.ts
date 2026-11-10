// lib/releases.ts
//
// The release schedule. Edit PROJECTS below to add or change songs.
//
// - The gallery (and the updates page) play the newest track whose
//   releaseDate is today or earlier, Detroit time, so each song takes over
//   automatically at midnight Eastern on its release date.
// - The "Release rollout" section on the updates page (/story) is built
//   from this same list.
// - New songs live in the Supabase "tracks" bucket. Upload each file named
//   exactly like its `file` value below (spaces and capitals matter).
//   It's fine to upload early: nothing plays before its date.

export type Release = {
  title: string;
  audioUrl: string;
  releaseDate: string; // YYYY-MM-DD
};

export type ProjectTrack = {
  title: string;
  // YYYY-MM-DD. Leave out for a song that's already out on an earlier project.
  releaseDate?: string;
  // Path inside Supabase Storage (bucket/filename). Only needed with a date.
  file?: string;
  // Shown instead of a date when there's no releaseDate.
  note?: string;
};

export type Project = {
  name: string;
  kind: "EP" | "Album";
  fullReleaseDate: string; // YYYY-MM-DD
  tracks: ProjectTrack[];
};

const BASE =
  "https://bzllhepdcooxjekehkvc.supabase.co/storage/v1/object/public";

export const PROJECTS: Project[] = [
  {
    name: "Amore",
    kind: "EP",
    fullReleaseDate: "2026-11-12",
    tracks: [
      {
        title: "Peace Of Mind",
        releaseDate: "2026-09-16",
        file: "Login page video/Peace Of Mind.wav",
      },
      {
        title: "Change My Plans",
        releaseDate: "2026-09-30",
        file: "tracks/Change My Plans.mp3",
      },
      {
        title: "Whoever You Wanna Be",
        releaseDate: "2026-10-14",
        file: "tracks/Whoever You Wanna Be.mp3",
      },
      {
        title: "Denim Blues",
        releaseDate: "2026-10-28",
        file: "tracks/Denim Blues mp3.mp3",
      },
      {
        title: "Smitten",
        releaseDate: "2026-11-11",
        file: "tracks/Smitten.mp3",
      },
    ],
  },
  {
    name: "The Fool",
    kind: "Album",
    fullReleaseDate: "2027-03-18",
    tracks: [
      {
        title: "Hummingbirds",
        releaseDate: "2026-11-25",
        file: "tracks/Hummingbirds.mp3",
      },
      {
        title: "Reborn",
        releaseDate: "2026-12-09",
        file: "tracks/Reborn.mp3",
      },
      { title: "Smitten", note: "on Amore" },
      {
        title: "Its All Aroundja",
        releaseDate: "2026-12-23",
        file: "tracks/Its All Aroundja.mp3",
      },
      {
        title: "Peonies",
        releaseDate: "2027-01-06",
        file: "tracks/Peonies.mp3",
      },
      {
        title: "Is It Alright?",
        releaseDate: "2027-01-20",
        file: "tracks/Is It Alright.mp3",
      },
      {
        title: "My Nature",
        releaseDate: "2027-02-03",
        file: "tracks/My Nature.mp3",
      },
      {
        title: "Memories",
        releaseDate: "2027-02-17",
        file: "tracks/Memories.mp3",
      },
      {
        title: "Running Out Of Time",
        releaseDate: "2027-03-03",
        file: "tracks/Running Out Of Time.mp3",
      },
      {
        title: "Story",
        releaseDate: "2027-03-17",
        file: "tracks/Story.mp3",
      },
    ],
  },
];

const storageUrl = (path: string) =>
  `${BASE}/${path.split("/").map(encodeURIComponent).join("/")}`;

// Every dated single, oldest first.
export const RELEASES: Release[] = PROJECTS.flatMap((p) => p.tracks)
  .filter((t) => t.releaseDate && t.file)
  .map((t) => ({
    title: t.title,
    audioUrl: storageUrl(t.file as string),
    releaseDate: t.releaseDate as string,
  }))
  .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));

// Today's date in Detroit (YYYY-MM-DD), so releases flip at midnight
// Eastern regardless of the visitor's own timezone.
export function todayInDetroit(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Detroit",
  });
}

export function getCurrentRelease(): Release {
  const today = todayInDetroit();
  const released = RELEASES.filter((r) => r.releaseDate <= today);

  // Newest released track, or the earliest one if nothing is out yet.
  return released[released.length - 1] ?? RELEASES[0];
}
