// pages/api/geo.ts
// Returns the visitor's approximate location ("Ann Arbor, MI, United States")
// using the headers Vercel adds to every request. Replaces the outside
// ipapi.co lookup, which Safari's privacy protection often blocks, and
// keeps visitors' IP addresses from going to a third party.
import type { NextApiRequest, NextApiResponse } from "next";

function header(req: NextApiRequest, name: string): string {
  const raw = req.headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  // Vercel URL-encodes the city (e.g. "S%C3%A3o%20Paulo")
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function countryName(code: string): string {
  if (!code) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const city = header(req, "x-vercel-ip-city");
  const region = header(req, "x-vercel-ip-country-region");
  const country = countryName(header(req, "x-vercel-ip-country"));

  const location = [city, region, country].filter(Boolean).join(", ");

  // Each visitor's own location, so never cache it
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({ location });
}