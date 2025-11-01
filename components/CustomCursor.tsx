"use client";
import { useEffect } from "react";

export default function CustomCursor() {
  useEffect(() => {
    const cursor = document.createElement("div");
    cursor.className = "purple-bulb-cursor";
    cursor.innerHTML = `
      <svg class="bulb-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs>
          <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#e9d5ff" stop-opacity="1"/>
            <stop offset="50%" stop-color="#c4b5fd" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#6d28d9" stop-opacity="0.4"/>
          </radialGradient>
        </defs>
        <g filter="url(#shadow)">
          <path d="M32 4c-9 0-16 7-16 16 0 5.7 2.5 10 6 13v9h20v-9c3.5-3 6-7.3 6-13 0-9-7-16-16-16z" fill="url(#bulbGlow)"/>
          <rect x="26" y="42" width="12" height="8" rx="2" ry="2" fill="#a78bfa" />
          <rect x="28" y="50" width="8" height="3" rx="1" ry="1" fill="#7c3aed" />
        </g>
      </svg>
    `;
    document.body.appendChild(cursor);

    const moveCursor = (e: MouseEvent) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
      cursor.style.opacity = "1";
    };

    const fadeOut = () => (cursor.style.opacity = "0.6");

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseleave", fadeOut);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseleave", fadeOut);
      cursor.remove();
    };
  }, []);

  return null;
}
