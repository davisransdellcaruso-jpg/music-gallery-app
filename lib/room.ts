// Shared server-side helpers for the supporters' listening room.
// Server-only: never import this file from a component.
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export const BUCKET = "listening-room";
const COOKIE = "room_session";
const SECRET = process.env.ROOM_SECRET || "";

// Service-role client: bypasses row-level security, so it only runs in API routes.
export const roomDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
);

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://daviscaruso.com").replace(/\/$/, "");
export const siteUrl = () => SITE_URL;

type Kind = "link" | "session";

function sign(body: string) {
  return crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
}

// Room access is a rolling 30 days: every visit resets the clock.
export const IDLE_DAYS = 30;
export const IDLE_SECONDS = 60 * 60 * 24 * IDLE_DAYS;
// Emailed links carry a far-off hard expiry; whether they still work is decided by
// how recently the supporter was last in the room (see linkStillOpen).
export const LINK_MAX_SECONDS = 60 * 60 * 24 * 365 * 5;

export function makeToken(email: string, kind: Kind, ttlSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ e: email, k: kind, i: now, x: now + ttlSeconds })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readToken(token: string | undefined, kind: Kind): string | null {
  return readTokenFull(token, kind)?.email ?? null;
}

// Like readToken, but also returns when the token was issued (seconds).
export function readTokenFull(token: string | undefined, kind: Kind): { email: string; issued: number } | null {
  if (!SECRET || !token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(new Uint8Array(a), new Uint8Array(b))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.k !== kind || typeof p.e !== "string" || p.x < Date.now() / 1000) return null;
    // Links sent before issue times were added lasted 7 days, so back-date from their expiry.
    const issued = typeof p.i === "number" ? p.i : p.x - 60 * 60 * 24 * 7;
    return { email: p.e, issued };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, maxAgeSeconds: number) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

// An emailed link works if the supporter has been in the room (or got the link)
// within the last 30 days. If the activity column isn't there yet, the link's
// own issue date is used, so links still work for 30 days after sending.
export async function linkStillOpen(email: string, issued: number): Promise<boolean> {
  let last = issued;
  const { data, error } = await roomDb
    .from("supporters")
    .select("room_last_active")
    .eq("email", email)
    .maybeSingle();
  if (!error && data?.room_last_active) {
    last = Math.max(last, Math.floor(new Date(data.room_last_active).getTime() / 1000));
  }
  return Date.now() / 1000 - last <= IDLE_SECONDS;
}

// Resets the 30-day clock: a fresh session cookie plus a "last in the room" timestamp.
export async function touchSupporter(res: NextApiResponse, email: string) {
  res.setHeader("Set-Cookie", sessionCookie(makeToken(email, "session", IDLE_SECONDS), IDLE_SECONDS));
  const { error } = await roomDb
    .from("supporters")
    .update({ room_last_active: new Date().toISOString() })
    .eq("email", email);
  if (error) console.error("touchSupporter: couldn't record visit (run supabase/room_link_activity.sql?)", error.message);
}

// Case-insensitive lookup only: returns the email exactly as stored, or null. Never adds anyone.
export async function lookupSupporter(email: string): Promise<string | null> {
  const clean = (email || "").trim().replace(/[\\%_]/g, (c) => `\\${c}`);
  if (!clean) return null;
  const { data } = await roomDb
    .from("supporters")
    .select("email")
    .ilike("email", clean)
    .limit(1)
    .maybeSingle();
  return data?.email ?? null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Open door: returns the supporter's stored email, adding them to `supporters` if they're new.
// Existing supporters are left as-is, so there are never duplicates.
export async function ensureSupporter(email: string): Promise<string | null> {
  const clean = (email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(clean) || clean.length > 254) return null;

  const existing = await lookupSupporter(clean);
  if (existing) return existing;

  const { error } = await roomDb.from("supporters").insert({ email: clean });
  // 23505 = already exists (two signups at once), which is fine
  if (error && error.code !== "23505") {
    console.error("ensureSupporter insert failed:", error);
    return null;
  }
  return (await lookupSupporter(clean)) ?? clean;
}

// The signup route calls this when someone asks for a link.
// It now adds new emails to `supporters`, so anyone who signs up gets in.
export const findSupporter = ensureSupporter;

// The signed-in supporter's email, or null. Lookup only.
export async function getSupporter(req: NextApiRequest): Promise<string | null> {
  const email = readToken(req.cookies[COOKIE], "session");
  return email ? lookupSupporter(email) : null;
}

export function isStudio(email: string | null) {
  const studio = (process.env.STUDIO_EMAIL || "").trim().toLowerCase();
  return !!email && !!studio && email.toLowerCase() === studio;
}

export function parseBody(req: NextApiRequest): any {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body || {};
}