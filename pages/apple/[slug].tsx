// daviscaruso.com/apple/<business-slug> → logs a tap, opens the Apple Music playlist
import { playlistRedirect } from "../../lib/playlistRedirect";

export const getServerSideProps = playlistRedirect("apple");

export default function AppleMusicRedirect() {
  return null;
}