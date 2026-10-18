// The five songs people can receive. File names must match the files in your
// Supabase Storage bucket EXACTLY (spaces, capitals, and the .mp3 ending).

export const SONG_BUCKET = "songs from Periwinkle";

export const SONGS = [
  "Not Lookin Around.mp3",
  "Periwinkle.mp3",
  "Second Chances.mp3",
  "Somethin even Better.mp3",
  "Take Me Home.mp3",
];

export const songTitle = (file: string) => file.replace(/\.mp3$/i, "");