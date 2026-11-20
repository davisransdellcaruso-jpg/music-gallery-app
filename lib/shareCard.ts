// lib/shareCard.ts  (browser)
// Fetches a fan's story-sized share card (/api/share-card) and opens the
// phone's share sheet with it (Instagram, TikTok, Messages...). Where sharing
// files isn't supported (most desktops), the image downloads instead.
import { track } from "@vercel/analytics";

export type SharablePin = { id: string; edit_token?: string };

export async function shareMyPin(
  pin: SharablePin,
  lang: "en" | "es",
  text: string
): Promise<boolean> {
  const params = new URLSearchParams({ id: pin.id, lang });
  if (pin.edit_token) params.set("t", pin.edit_token);
  const res = await fetch(`/api/share-card?${params}`);
  if (!res.ok) return false;
  const blob = await res.blob();
  const file = new File([blob], "la-famiglia.png", { type: "image/png" });

  const nav = navigator as Navigator & {
    canShare?: (d: ShareData) => boolean;
  };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: `${text} daviscaruso.com/welcome-map` });
      track("Share Card", { how: "share" });
    } catch {
      /* they closed the share sheet: fine */
    }
    return true;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "la-famiglia.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  track("Share Card", { how: "download" });
  return true;
}
