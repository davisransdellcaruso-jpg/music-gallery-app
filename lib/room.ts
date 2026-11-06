// Shared server-side helpers for the supporters' listening room.
// Server-only: never import this file from a component.
import crypto from "crypto";
import type { NextApiRequest } from "next";
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

export function makeToken(email: string, kind: Kind, ttlSeconds: number) {
  const body = Buffer.from(
    JSON.stringify({ e: email, k: kind, x: Math.floor(Date.now() / 1000) + ttlSeconds })
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readToken(token: string | undefined, kind: Kind): string | null {
  if (!SECRET || !token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.k !== kind || typeof p.e !== "string" || p.x < Date.now() / 1000) return null;
    return p.e;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, maxAgeSeconds: number) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

// Case-insensitive lookup that returns the email exactly as stored in the table.
export async function findSupporter(email: string): Promise<string | null> {
  const clean = email.trim().replace(/[\\%_]/g, (c) => `\\${c}`);
  if (!clean) return null;
  const { data } = await roomDb
    .from("supporters")
    .select("email")
    .ilike("email", clean)
    .limit(1)
    .maybeSingle();
  return data?.email ?? null;
}

// The signed-in supporter's email, or null.
export async function getSupporter(req: NextApiRequest): Promise<string | null> {
  const email = readToken(req.cookies[COOKIE], "session");
  return email ? findSupporter(email) : null;
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
