// pages/api/song-opt-in.ts
// Step 2 of the welcome popup: someone who just gave their email says
// "yes" to the unreleased Periwinkle song. Marks them so the confirm page
// shows them the song once they confirm their email.
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: "Invalid email.", code: "email" });
  }

  // Only flips the flag on an address already on the list. It can't add
  // anyone or send anything, and it answers the same way either way so it
  // never reveals who is on the list.
  const { error } = await supabaseAdmin
    .from("mailing_list")
    .update({ wants_song: true })
    .eq("email", email);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error.", code: "server" });
  }

  return res.status(200).json({ ok: true });
}