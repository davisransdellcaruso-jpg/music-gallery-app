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
    "Listeners from all over the world are on this map. Add yourself and tell us how you found my music, or skip it and head straight to the story. Totally up to you.",
  flowAdd: "📍 Add myself",
  flowSkip: "Skip for now 😢",
  flowDoneTitle: "You're on the map! 💜",
  flowDoneBody: "Thanks for joining in. Ready for the story?",
  flowContinue: "Continue to the story →",

  // Form
  formTitle: "📍 Add yourself to the map",
  formPrivacy: "Only your city is shown, never your exact location.",
  nameLabel: "First name or nickname",
  cityLabel: "Your city",
  cityPlaceholder: "Start typing…",
  storyLabel: "How did you find my music?",
  storyPlaceholder: "A friend played it in the car, I caught a set downtown…",
  submit: "Add my pin",
  sending: "Sending…",
  cancel: "Cancel",
  publicNote:
    "Your name and story will be public once approved. Please leave out links and email addresses.",
  thanksTitle: "Thank you!",
  thanksBody:
    "I read every pin before it goes live. In the meantime you'll see a dashed pin of your own on the map (just on this device).",
  backToMap: "Back to the map",
  stayOnMap: "Stay on the map",

  // Form errors
  errName: "Please add a first name or nickname.",
  errCity: "Please pick your city from the suggestions.",
  errStory: "Tell us a little more. A sentence or two is perfect.",
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
    "Hay oyentes de todo el mundo en este mapa. Agrégate y cuéntanos cómo conociste mi música, o sáltalo y pasa directo a la historia. Tú decides.",
  flowAdd: "📍 Agregarme",
  flowSkip: "Saltar por ahora 😢",
  flowDoneTitle: "¡Ya estás en el mapa! 💜",
  flowDoneBody: "Gracias por sumarte. ¿Seguimos con la historia?",
  flowContinue: "Continuar a la historia →",

  formTitle: "📍 Agrégate al mapa",
  formPrivacy: "Solo se muestra tu ciudad, nunca tu ubicación exacta.",
  nameLabel: "Nombre o apodo",
  cityLabel: "Tu ciudad",
  cityPlaceholder: "Empieza a escribir…",
  storyLabel: "¿Cómo descubriste mi música?",
  storyPlaceholder: "Un amigo la puso en el carro, te vi tocar en el centro…",
  submit: "Agregar mi pin",
  sending: "Enviando…",
  cancel: "Cancelar",
  publicNote:
    "Tu nombre y tu historia serán públicos una vez aprobados. Por favor, no incluyas enlaces ni correos electrónicos.",
  thanksTitle: "¡Gracias!",
  thanksBody:
    "Reviso cada pin antes de publicarlo. Mientras tanto, verás tu propio pin con línea punteada en el mapa (solo en este dispositivo).",
  backToMap: "Volver al mapa",
  stayOnMap: "Quedarme en el mapa",

  errName: "Agrega tu nombre o un apodo.",
  errCity: "Elige tu ciudad de las sugerencias.",
  errStory: "Cuéntanos un poco más. Una o dos frases son perfectas.",
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