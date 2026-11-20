// components/ShareCardModal.tsx
// Shows a fan's La Famiglia share card and lets them save or post it.
// The image is fetched as soon as this opens, so tapping "Save or share"
// opens the share sheet right away (phones only allow that straight from a tap).
// Only the image is shared, no text, so iPhones offer "Save Image" and
// Instagram / TikTok stories accept it.
"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { track } from "@vercel/analytics";
import { canShareImage, shareCardUrl, type SharablePin } from "@/lib/shareCard";
import type { Lang, Strings } from "./i18n";

const btn: CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
  color: "#f2eafa",
  background: "#e8762c",
  width: "100%",
  textAlign: "center",
  textDecoration: "none",
  display: "block",
  boxSizing: "border-box",
};

export default function ShareCardModal({
  pin,
  lang,
  t,
  onClose,
}: {
  pin: SharablePin;
  lang: Lang;
  t: Strings;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    let objectUrl: string | null = null;
    let cancelled = false;
    fetch(shareCardUrl(pin, lang))
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setFile(new File([blob], "la-famiglia.png", { type: "image/png" }));
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pin, lang]);

  const sharable = !!file && canShareImage(file);

  function share() {
    if (!file) return;
    // No awaits before this line: the share sheet needs the tap itself
    navigator
      .share({ files: [file] })
      .then(() => track("Share Card", { how: "share" }))
      .catch(() => {
        /* closed the sheet: fine */
      });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        background: "rgba(83,40,143,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(360px, 100%)",
          maxHeight: "100%",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: 16,
          borderRadius: 16,
          background: "#f2eafa",
          border: "3px solid #53288f",
          boxShadow: "6px 6px 0 #e8762c",
          color: "#53288f",
          textAlign: "center",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{t.shareTitle}</div>

        <div
          style={{
            width: "100%",
            aspectRatio: "9 / 16",
            maxHeight: "58vh",
            margin: "0 auto",
            borderRadius: 10,
            overflow: "hidden",
            background: "#e6d6f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {url ? (
            // Press-and-hold on this image saves it to the phone's photos
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={t.shareTitle} style={{ height: "100%", width: "auto", display: "block" }} />
          ) : (
            <span style={{ fontSize: 14 }}>{failed ? t.shareFailed : t.shareMaking}</span>
          )}
        </div>

        {url && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {sharable ? (
              <button onClick={share} style={btn}>
                {t.shareSave}
              </button>
            ) : (
              <a
                href={url}
                download="la-famiglia.png"
                onClick={() => track("Share Card", { how: "download" })}
                style={btn}
              >
                {t.shareDownload}
              </a>
            )}
            <p style={{ fontSize: 12, color: "#7e57c9", margin: 0, lineHeight: 1.45 }}>
              {touch ? `${t.shareHoldTip} ` : ""}
              {t.shareHint}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 10,
            background: "transparent",
            border: "none",
            color: "#7e57c9",
            textDecoration: "underline",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {t.shareClose}
        </button>
      </div>
    </div>
  );
}
