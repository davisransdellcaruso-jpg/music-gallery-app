// lib/signupEventsServer.ts
// Server-side writer for the `signup_events` table (see supabase/signup_events.sql).
// Only import this from files in pages/api/ or getServerSideProps.
// It never throws: if the table isn't set up yet, signups keep working.
import { supabaseAdmin } from "./supabaseAdmin";
import { cleanSource } from "./signupTracking";

const EVENTS = new Set(["shown", "dismissed", "submitted", "confirmed", "button"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function recordSignupEvent(input: {
  event: string;
  source?: unknown;
  visitorId?: unknown;
  page?: unknown;
  country?: string | null;
}): Promise<void> {
  if (!EVENTS.has(input.event)) return;

  const visitor =
    typeof input.visitorId === "string" && UUID.test(input.visitorId)
      ? input.visitorId
      : null;
  const page = String(input.page ?? "").slice(0, 80) || null;

  try {
    const { error } = await supabaseAdmin.from("signup_events").insert({
      event: input.event,
      source: cleanSource(input.source) ?? "direct",
      visitor_id: visitor,
      page,
      country: input.country ?? null,
    });
    if (error) console.error("signup_events insert failed:", error.message);
  } catch (err) {
    console.error("signup_events insert failed:", err);
  }
}
