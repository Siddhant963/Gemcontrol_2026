import { useSyncExternalStore } from "react";
import ui from "./hi/ui";
import messages from "./hi/messages";
import marketing from "./hi/marketing";
import data from "./hi/data";
import legal from "./hi/legal";
import patterns from "./hi/patterns";

// English is the source language; every other language is a dictionary of
// English phrase -> translation. Anything without an entry stays in English,
// so a missing translation never breaks the screen.
export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिन्दी", short: "हिं" },
];

const STORAGE_KEY = "ratnsetu_lang";
const DICTIONARIES = { hi: { ...ui, ...messages, ...marketing, ...data, ...legal } };

const norm = (s) => s.replace(/\s+/g, " ").trim();

// Lower-cased index so "INVOICE NO:" / "Invoice No:" share one entry.
const LOWER = {};
Object.entries(DICTIONARIES).forEach(([code, dict]) => {
  LOWER[code] = {};
  Object.keys(dict).forEach((k) => {
    LOWER[code][norm(k).toLowerCase()] = dict[k];
  });
});

const readStored = () => {
  try {
    // ?lang=hi (or en) in the URL wins and is remembered, so a link can open
    // the site in a chosen language.
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (LANGUAGES.some((l) => l.code === fromUrl)) {
      localStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const v = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.some((l) => l.code === v) ? v : "en";
  } catch {
    return "en";
  }
};

let current = readStored();
const listeners = new Set();

export const getLanguage = () => current;

export const setLanguage = (code) => {
  if (!LANGUAGES.some((l) => l.code === code) || code === current) return;
  current = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* storage unavailable -- language still applies for this session */
  }
  if (typeof document !== "undefined") document.documentElement.lang = code;
  listeners.forEach((fn) => fn());
};

export const subscribeLanguage = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useLanguage = () => {
  const lang = useSyncExternalStore(subscribeLanguage, getLanguage, () => "en");
  return { lang, setLanguage, isHindi: lang === "hi" };
};

const lookup = (code, text) => {
  const dict = DICTIONARIES[code];
  if (!dict) return null;
  const key = norm(text);
  if (!key) return null;
  if (dict[key] !== undefined) return dict[key];
  const lower = LOWER[code][key.toLowerCase()];
  if (lower !== undefined) return lower;
  // "Name:" / "Name :" / "Name..." / "Name!" share the entry for "Name".
  const m = key.match(/^(.*?)\s*([:.!…]+)$/);
  if (m && m[1]) {
    const base = dict[m[1]] ?? LOWER[code][m[1].toLowerCase()];
    if (base !== undefined) return base + (m[2] === ":" ? ":" : m[2]);
  }
  return null;
};

// Translate one string. Surrounding whitespace is preserved so React text
// fragments like " items" keep their spacing.
export const translateText = (text, code = current) => {
  if (code === "en" || typeof text !== "string") return text;
  const lead = text.match(/^\s*/)[0];
  const trail = text.match(/\s*$/)[0];
  const core = text.slice(lead.length, text.length - trail.length);
  if (!core) return text;

  let out = lookup(code, core);
  if (out == null) {
    for (const [re, build] of patterns) {
      const match = norm(core).match(re);
      if (match) {
        out = build(match, (s) => lookup(code, s) ?? s);
        break;
      }
    }
  }
  return out == null ? text : lead + out + trail;
};

// Explicit helper for strings built in JS code (e.g. window.alert, PDF text).
export const t = (text) => translateText(text);
