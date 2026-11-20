// lib/butterflies.ts  (server only: import from pages/api/)
// Notes where a listener was when they joined La Famiglia, and links their
// anonymous browser ID to their signup or pin. The map turns them into a 🦋
// once the email is confirmed or the pin approved (see supabase/butterflies.sql).
// Never throws: a problem here must never break a signup or a pin.
import type { NextApiRequest } from "next";
import { supabaseAdmin } from "./supabaseAdmin";
import { isNoTrackRequest } from "./noTrack";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const round2 = (n: number) => Math.round(n * 100) / 100;

function header(req: NextApiRequest, name: string): string {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export async function noteButterfly(
  req: NextApiRequest,
  visitorId: unknown,
  link: { email?: string; pinId?: string }
): Promise<void> {
  if (typeof visitorId !== "string" || !UUID.test(visitorId)) return;
  if (isNoTrackRequest(req)) return; // your own devices stay off the map
  try {
    if (link.email) {
      await supabaseAdmin
        .from("mailing_list")
        .update({ visitor_id: visitorId })
        .eq("email", link.email);
    }
    if (link.pinId) {
      await supabaseAdmin
        .from("fan_pins")
        .update({ visitor_id: visitorId })
        .eq("id", link.pinId);
    }

    const lat = parseFloat(header(req, "x-vercel-ip-latitude"));
    const lng = parseFloat(header(req, "x-vercel-ip-longitude"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    let city: string | null = null;
    try {
      city = decodeURIComponent(header(req, "x-vercel-ip-city")) || null;
    } catch {
      city = null;
    }
    // First place they joined from wins; later signups don't move them
    await supabaseAdmin.from("butterflies").upsert(
      {
        visitor_id: visitorId,
        latitude: round2(lat),
        longitude: round2(lng),
        city,
        region: header(req, "x-vercel-ip-country-region") || null,
        country: header(req, "x-vercel-ip-country") || null,
      },
      { onConflict: "visitor_id", ignoreDuplicates: true }
    );
  } catch (err) {
    console.error("noteButterfly failed:", err);
  }
}
