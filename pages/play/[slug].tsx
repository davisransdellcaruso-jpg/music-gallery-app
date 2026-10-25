// daviscaruso.com/play/<business-slug> → logs a tap, opens the Spotify playlist
import { playlistRedirect } from "../../lib/playlistRedirect";

export const getServerSideProps = playlistRedirect("spotify");

export default function SpotifyRedirect() {
  return null;
}