// Place at: pages/welcome-map.tsx   (served at /welcome-map)
//
// The step between email signup and /story. Send people here after they sign
// up / confirm their email:  router.push("/welcome-map")
// "Skip" and "Continue" both lead on to /story.
//
// Adjust the import path if your ListenerMap lives somewhere else.

import ListenerMap from "@/components/ListenerMap";

export default function WelcomeMapPage() {
  return <ListenerMap flow nextHref="/story" />;
}