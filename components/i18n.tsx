"use client";
// English / Spanish strings for the listener map + fan pin form.
// Language is picked in this order: ?lang=es|en in the URL, the visitor's
// saved choice (localStorage "dc_lang"), then their browser language.

import { useCallback, useEffect, useState } from "react";

export type Lang = "en" | "es";

const en = {
  title: "🌎 Map of La Famiglia",
  searchPlaceholder: "Find a fan or city…",
  addYourself: "📍 Add yourself",
  findMyPin: "✨ Find my pin",

  // Map key (legend)
  legendTitle: "Map key",
  legendListeners: "Listeners",
  legendFans: "Fans · tap to read",
  legendMe: "That's you",
  legendPending: "Your pin, waiting for approval",
  stats: (stories: number, listens: number) =>
    `${stories} fan ${stories === 1 ? "story" : "stories"} · ${listens.toLocaleString(
      "en-US"
    )} listens worldwide`,

  // Map tooltips + popups
  listenCount: (n: number) =>
    `${n.toLocaleString("en-US")} ${n === 1 ? "listen" : "listens"}`,
  somewhere: "Somewhere",
  thatsYou: "✨ That's you!",
  pendingNote: "⏳ Your pin, pending approval",

  // Signup flow (welcome banner)
  flowTitle: "You're part of this 🌎",
  flowBody:
    "Listeners from all over the world are on this map. Add yourself, tell me the first lyrics that pop into your head, and pick an emoji for your mood, or skip it and head straight to the updates. Totally up to you.",
  flowAdd: "📍 Add myself",
  flowSkip: "Skip for now 😢",
  flowDoneTitle: "You're on the map! 💜",
  flowDoneBody: "Thanks for joining in. Ready for the updates?",
  flowContinue: "Continue to the updates →",

  // Form
  formTitle: "📍 Add yourself to the map",
  formPrivacy: "Only your city is shown, never your exact location.",
  nameLabel: "First name or nickname",
  cityLabel: "Your city",
  cityPlaceholder: "Start typing…",
  storyLabel: "Tell me the first lyrics that pop into your head...!",
  storyPlaceholder: "la la la… whatever comes to mind",
  moodLabel: "Pick an emoji for your mood",
  emailLabel: "Email (optional)",
  emailPlaceholder: "you@example.com",
  emailHint:
    "Didn't grab your song yet? Add your email and I'll send you one from Periwinkle. Never shown on the map.",
  submit: "Add my pin",
  sending: "Sending…",
  cancel: "Cancel",
  publicNote:
    "Your name, lyrics and emoji will be public once approved (your email never is). Please keep links and email addresses out of your lyrics.",
  thanksTitle: "Thank you!",
  thanksBody:
    "I read every pin before it goes live. In the meantime you'll see a dashed pin of your own on the map (just on this device).",
  backToMap: "Back to the map",
  stayOnMap: "Stay on the map",
  emailSent: "📬 Check your inbox to confirm your email and get your song.",
  emailFailed:
    "Your pin is in, but the email didn't go through. You can try again from the gallery page.",

  // Form errors
  errName: "Please add a first name or nickname.",
  errCity: "Please pick your city from the suggestions.",
  errStory: "Please share a few words of lyrics.",
  errMood: "Please pick an emoji for your mood.",
  errEmail: "That email doesn't look quite right. Fix it or leave it blank.",
  errLinks: "Please leave links and email addresses out.",
  errRate: "Too many submissions. Please try again later.",
  errServer: "Something went wrong. Please try again.",
  errNetwork: "Network hiccup. Please try again.",
};

export type Strings = typeof en;

export type ErrKey =
  | "errName"
  | "errCity"
  | "errStory"
  | "errMood"
  | "errEmail"
  | "errLinks"
  | "errRate"
  | "errServer"
  | "errNetwork";

const es: Strings = {
  title: "🌎 Mapa de La Famiglia",
  searchPlaceholder: "Busca a un fan o una ciudad…",
  addYourself: "📍 Agrégate",
  findMyPin: "✨ Encuentra mi pin",

  legendTitle: "Leyenda del mapa",
  legendListeners: "Oyentes",
  legendFans: "Fans · toca para leer",
  legendMe: "Eres tú",
  legendPending: "Tu pin, en espera de aprobación",
  stats: (stories, listens) =>
    `${stories} ${
      stories === 1 ? "historia de fan" : "historias de fans"
    } · ${listens.toLocaleString("es")} reproducciones en el mundo`,

  listenCount: (n) =>
    `${n.toLocaleString("es")} ${n === 1 ? "reproducción" : "reproducciones"}`,
  somewhere: "En algún lugar",
  thatsYou: "✨ ¡Eres tú!",
  pendingNote: "⏳ Tu pin, pendiente de aprobación",

  flowTitle: "Eres parte de esto 🌎",
  flowBody:
    "Hay oyentes de todo el mundo en este mapa. Agrégate, dime la primera letra que te venga a la cabeza y elige un emoji para tu estado de ánimo, o sáltalo y pasa directo a las novedades. Tú decides.",
  flowAdd: "📍 Agregarme",
  flowSkip: "Saltar por ahora 😢",
  flowDoneTitle: "¡Ya estás en el mapa! 💜",
  flowDoneBody: "Gracias por sumarte. ¿Seguimos con las novedades?",
  flowContinue: "Continuar a las novedades →",

  formTitle: "📍 Agrégate al mapa",
  formPrivacy: "Solo se muestra tu ciudad, nunca tu ubicación exacta.",
  nameLabel: "Nombre o apodo",
  cityLabel: "Tu ciudad",
  cityPlaceholder: "Empieza a escribir…",
  storyLabel: "Dime la primera letra que te venga a la cabeza...!",
  storyPlaceholder: "la la la… lo que se te ocurra",
  moodLabel: "Elige un emoji para tu estado de ánimo",
  emailLabel: "Correo electrónico (opcional)",
  emailPlaceholder: "tu@ejemplo.com",
  emailHint:
    "¿Todavía no recibiste tu canción? Deja tu correo y te mando una de Periwinkle. Nunca se muestra en el mapa.",
  submit: "Agregar mi pin",
  sending: "Enviando…",
  cancel: "Cancelar",
  publicNote:
    "Tu nombre, la letra y tu emoji serán públicos una vez aprobados (tu correo nunca). Por favor, no incluyas enlaces ni correos en la letra.",
  thanksTitle: "¡Gracias!",
  thanksBody:
    "Reviso cada pin antes de publicarlo. Mientras tanto, verás tu propio pin con línea punteada en el mapa (solo en este dispositivo).",
  backToMap: "Volver al mapa",
  stayOnMap: "Quedarme en el mapa",
  emailSent: "📬 Revisa tu correo para confirmarlo y recibir tu canción.",
  emailFailed:
    "Tu pin ya está, pero el correo no se pudo registrar. Puedes intentarlo de nuevo desde la galería.",

  errName: "Agrega tu nombre o un apodo.",
  errCity: "Elige tu ciudad de las sugerencias.",
  errStory: "Comparte unas palabras de la letra, por favor.",
  errMood: "Elige un emoji para tu estado de ánimo, por favor.",
  errEmail: "Ese correo no parece correcto. Corrígelo o déjalo en blanco.",
  errLinks: "Por favor, no incluyas enlaces ni correos electrónicos.",
  errRate: "Demasiados envíos. Inténtalo de nuevo más tarde.",
  errServer: "Algo salió mal. Inténtalo de nuevo.",
  errNetwork: "Problema de conexión. Inténtalo de nuevo.",
};

export const STRINGS: Record<Lang, Strings> = { en, es };

const STORAGE_KEY = "dc_lang";

export function useLang() {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      const saved = localStorage.getItem(STORAGE_KEY);
      const browser = (navigator.language || "en").toLowerCase().startsWith("es")
        ? "es"
        : "en";
      const pick = [fromUrl, saved, browser].find(
        (v) => v === "en" || v === "es"
      ) as Lang;
      setLangState(pick);
    } catch {
      /* storage / navigator unavailable: stay on English */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  return { lang, setLang, t: STRINGS[lang] };
}