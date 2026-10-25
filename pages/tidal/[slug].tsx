// daviscaruso.com/tidal/<business-slug> → logs a tap, opens the Tidal playlist
import { playlistRedirect } from "../../lib/playlistRedirect";

export const getServerSideProps = playlistRedirect("tidal");

export default function TidalRedirect() {
  return null;
}