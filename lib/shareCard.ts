// lib/shareCard.ts  (browser)
// Helpers for a fan's story-sized share card (/api/share-card).

export type SharablePin = { id: string; edit_token?: string };

export function shareCardUrl(pin: SharablePin, lang: "en" | "es"): string {
  const params = new URLSearchParams({ id: pin.id, lang });
  if (pin.edit_token) params.set("t", pin.edit_token);
  return `/api/share-card?${params}`;
}

// True where the browser can hand an image to the phone's share sheet
// (iPhone/Android: Save Image, Instagram, TikTok, Messages...)
export function canShareImage(file: File): boolean {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  try {
    return !!nav.canShare?.({ files: [file] });
  } catch {
    return false;
  }
}
