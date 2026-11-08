// daviscaruso.com/youtube/<business-slug> → logs a tap, opens the YouTube playlist
import { playlistRedirect } from "../../lib/playlistRedirect";

export const getServerSideProps = playlistRedirect("youtube");

export default function YouTubeRedirect() {
  return null;
}