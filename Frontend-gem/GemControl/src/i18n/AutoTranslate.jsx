import { useEffect } from "react";
import { useLanguage, translateText } from "./index";

// Translates every piece of visible text in the page (text nodes plus the
// placeholder / title / aria-label / alt attributes) using the dictionary, and
// keeps doing so as React renders new content. Original English is remembered
// per node so switching back to English restores it exactly.
const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);

const textState = new WeakMap(); // Text node -> { orig, out }
const attrState = new WeakMap(); // Element -> { [attr]: { orig, out } }
const trackedText = new Set(); // WeakRef-free list so we can restore on switch
const trackedAttr = new Set();

const isSkipped = (el) => {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (SKIP_TAGS.has(n.tagName)) return true;
    if (n.classList?.contains("material-symbols-outlined")) return true;
    if (n.classList?.contains("notranslate")) return true;
    if (n.getAttribute?.("translate") === "no") return true;
  }
  return false;
};

const translateTextNode = (node, lang) => {
  const parent = node.parentElement;
  if (!parent || isSkipped(parent)) return;
  const st = textState.get(node);
  const value = node.nodeValue;
  // If the value differs from what we wrote, React put in fresh English.
  const orig = st && value === st.out ? st.orig : value;
  const out = lang === "en" ? orig : translateText(orig, lang);
  if (out !== value) node.nodeValue = out;
  textState.set(node, { orig, out });
  trackedText.add(node);
};

const translateAttrs = (el, lang) => {
  if (isSkipped(el)) return;
  let states = attrState.get(el);
  for (const attr of ATTRS) {
    const value = el.getAttribute(attr);
    if (value == null) continue;
    const st = states?.[attr];
    const orig = st && value === st.out ? st.orig : value;
    const out = lang === "en" ? orig : translateText(orig, lang);
    if (out !== value) el.setAttribute(attr, out);
    if (!states) {
      states = {};
      attrState.set(el, states);
    }
    states[attr] = { orig, out };
    trackedAttr.add(el);
  }
};

const walk = (root, lang) => {
  if (root.nodeType === 3) {
    translateTextNode(root, lang);
    return;
  }
  if (root.nodeType !== 1) return;
  if (SKIP_TAGS.has(root.tagName)) return;
  translateAttrs(root, lang);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = tw.nextNode();
  while (n) {
    if (n.nodeType === 3) translateTextNode(n, lang);
    else if (!SKIP_TAGS.has(n.tagName)) translateAttrs(n, lang);
    n = tw.nextNode();
  }
};

function AutoTranslate() {
  const { lang } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = lang;
    // Apply (or undo) everything already on the page.
    walk(document.body, lang);
    if (lang === "en") {
      trackedText.forEach((n) => {
        const st = textState.get(n);
        if (st && n.isConnected && n.nodeValue === st.out) n.nodeValue = st.orig;
      });
      trackedText.clear();
      trackedAttr.clear();
      return undefined;
    }

    let frame = 0;
    const pending = new Set();
    const flush = () => {
      frame = 0;
      const items = [...pending];
      pending.clear();
      items.forEach((n) => {
        if (n.isConnected) walk(n, lang);
      });
      // Drop nodes React has removed so the restore list doesn't grow forever.
      if (trackedText.size > 3000) trackedText.forEach((n) => !n.isConnected && trackedText.delete(n));
      if (trackedAttr.size > 3000) trackedAttr.forEach((n) => !n.isConnected && trackedAttr.delete(n));
    };
    const schedule = (node) => {
      pending.add(node);
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") m.addedNodes.forEach(schedule);
        else if (m.type === "characterData") schedule(m.target);
        else if (m.type === "attributes") schedule(m.target);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [lang]);

  return null;
}

export default AutoTranslate;
