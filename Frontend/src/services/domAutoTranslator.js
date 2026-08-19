/**
 * =================================================================
 * GLOBAL DOM AUTO-TRANSLATOR (INSTANT REACTIVE)
 * Exclusively powered by Google Maps API (VITE_GOOGLE_MAPS_API_KEY)
 * Instant translation without requiring page refresh.
 * =================================================================
 */

import { batchTranslateWithGoogleMapApi } from "./googleTranslationService";

const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "SVG",
  "PATH",
  "IFRAME",
  "CODE",
  "PRE",
  "NOSCRIPT",
  "CANVAS",
  "AUDIO",
  "VIDEO",
  "I",
  "KBD"
]);

// Known Material / FontAwesome Icon Ligatures to NEVER translate
const KNOWN_ICON_LIGATURES = new Set([
  "account_balance_wallet",
  "payments",
  "arrow_downward_alt",
  "arrow_upward",
  "arrow_forward",
  "arrow_back",
  "arrow_downward",
  "check_circle",
  "cancel",
  "pending",
  "info",
  "schedule",
  "location_on",
  "person",
  "help",
  "done",
  "close",
  "menu",
  "search",
  "refresh",
  "star",
  "notifications",
  "home",
  "call_made",
  "call_received",
  "expand_more",
  "expand_less",
  "warning",
  "error",
  "check",
  "delete",
  "edit",
  "visibility",
  "visibility_off",
  "account_circle",
  "settings",
  "phone",
  "email",
  "lock",
  "share",
  "download",
  "add",
  "remove"
]);

// WeakMaps & in-memory caches
const originalTextMap = new WeakMap();
const originalAttrMap = new WeakMap();
const translationDict = {};

// Clean bad cache on startup
const cleanupBadCache = (lang) => {
  try {
    const raw = localStorage.getItem(`jaladhaara_full_dict_${lang}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      KNOWN_ICON_LIGATURES.forEach(icon => {
        delete parsed[icon];
      });
      localStorage.setItem(`jaladhaara_full_dict_${lang}`, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {}
  return {};
};

const getCache = (lang) => {
  if (!translationDict[lang]) {
    translationDict[lang] = cleanupBadCache(lang);
  }
  return translationDict[lang];
};

const saveCache = (lang) => {
  try {
    if (translationDict[lang]) {
      localStorage.setItem(`jaladhaara_full_dict_${lang}`, JSON.stringify(translationDict[lang]));
    }
  } catch (e) {}
};

// Check if string should be translated
const shouldTranslateText = (text) => {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;

  // Digits, punctuation, symbols, currency amounts
  if (/^[\d\s.,/\\+*#@!?:;%₹$€£&|()[\]{}<>=_-]+$/.test(trimmed)) return false;

  // Reference codes or hex hashes
  if (/^#?[0-9a-fA-F]{6,32}$/.test(trimmed) || /^#\w+/.test(trimmed)) return false;

  // URLs or emails
  if (/^(https?:\/\/|\/|[\w.-]+@[\w.-]+\.\w+)/.test(trimmed)) return false;

  // Icon ligatures
  if (/^[a-z]+(_[a-z0-9]+)+$/.test(trimmed) || KNOWN_ICON_LIGATURES.has(trimmed.toLowerCase())) {
    return false;
  }

  return true;
};

// Check if element is an icon, code badge, or input
const isIgnoredElement = (el) => {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  if (IGNORED_TAGS.has(el.tagName)) return true;
  if (el.getAttribute("translate") === "no" || el.classList?.contains?.("notranslate")) return true;
  if (el.isContentEditable) return true;

  const className = String(el.className || "");
  if (
    /material-symbols|material-icons|fa-|icon|font-mono|badge-code/i.test(className) ||
    el.closest?.(".material-symbols-outlined, .material-symbols-rounded, .material-symbols-sharp, .material-icons, .font-mono")
  ) {
    return true;
  }

  return false;
};

let observer = null;
let currentLanguage = "en";
let isTranslating = false;
let debounceTimeout = null;

/**
 * Collect all text nodes and translateable attributes
 */
const collectTextNodes = (root) => {
  const textNodes = [];
  const attrElements = [];

  const walk = (node) => {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (parent && !isIgnoredElement(parent) && parent.tagName !== "INPUT" && parent.tagName !== "TEXTAREA") {
        if (shouldTranslateText(node.nodeValue)) {
          textNodes.push(node);
        }
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (isIgnoredElement(node)) return;

      if (node.placeholder && shouldTranslateText(node.placeholder)) {
        attrElements.push({ el: node, attr: "placeholder", value: node.placeholder });
      }
      if (node.title && shouldTranslateText(node.title)) {
        attrElements.push({ el: node, attr: "title", value: node.title });
      }

      for (let child = node.firstChild; child; child = child.nextSibling) {
        walk(child);
      }
    }
  };

  walk(root || document.body);
  return { textNodes, attrElements };
};

/**
 * Restore English original text across DOM
 */
export const restoreOriginalDom = () => {
  const { textNodes, attrElements } = collectTextNodes(document.body);

  textNodes.forEach((node) => {
    const orig = node.__jaladhaara_orig || originalTextMap.get(node);
    if (orig !== undefined) {
      node.nodeValue = orig;
    }
  });

  attrElements.forEach(({ el, attr }) => {
    const orig = el.__jaladhaara_orig_attrs?.[attr] || originalAttrMap.get(el)?.[attr];
    if (orig !== undefined) {
      el.setAttribute(attr, orig);
    }
  });
};

/**
 * Translate collected nodes to target language using Google Maps API
 */
export const translateDom = async (targetLang) => {
  const lang = (targetLang || currentLanguage || "en").toLowerCase();

  if (!lang || lang === "en") {
    restoreOriginalDom();
    return;
  }

  if (isTranslating) return;
  isTranslating = true;

  try {
    const cache = getCache(lang);
    const { textNodes, attrElements } = collectTextNodes(document.body);

    const textsToFetch = new Set();
    const nodeMapping = [];

    // Process text nodes
    textNodes.forEach((node) => {
      let orig = node.__jaladhaara_orig || originalTextMap.get(node);
      if (orig === undefined) {
        orig = node.nodeValue;
        originalTextMap.set(node, orig);
        node.__jaladhaara_orig = orig;
      }

      const trimmed = orig.trim();
      if (!trimmed || !shouldTranslateText(trimmed)) return;

      // Apply from cache immediately
      if (cache[trimmed]) {
        const leading = orig.match(/^\s*/)[0];
        const trailing = orig.match(/\s*$/)[0];
        node.nodeValue = leading + cache[trimmed] + trailing;
      } else {
        textsToFetch.add(trimmed);
        nodeMapping.push({ node, orig, trimmed });
      }
    });

    // Process attributes (placeholders, titles)
    const attrMapping = [];
    attrElements.forEach(({ el, attr, value }) => {
      let orig = el.__jaladhaara_orig_attrs?.[attr] || originalAttrMap.get(el)?.[attr];
      if (orig === undefined) {
        if (!originalAttrMap.has(el)) originalAttrMap.set(el, {});
        if (!el.__jaladhaara_orig_attrs) el.__jaladhaara_orig_attrs = {};
        orig = value;
        originalAttrMap.get(el)[attr] = orig;
        el.__jaladhaara_orig_attrs[attr] = orig;
      }

      const trimmed = orig.trim();
      if (!trimmed || !shouldTranslateText(trimmed)) return;

      if (cache[trimmed]) {
        el.setAttribute(attr, cache[trimmed]);
      } else {
        textsToFetch.add(trimmed);
        attrMapping.push({ el, attr, orig, trimmed });
      }
    });

    // If new texts need translating, batch translate with Google Maps API (single call)
    if (textsToFetch.size > 0) {
      const textArray = Array.from(textsToFetch);
      const translatedResults = await batchTranslateWithGoogleMapApi(textArray, lang, "en");

      // Update cache
      Object.entries(translatedResults).forEach(([orig, trans]) => {
        if (trans && trans !== orig) {
          cache[orig] = trans;
        }
      });
      saveCache(lang);

      // Apply to text nodes
      nodeMapping.forEach(({ node, orig, trimmed }) => {
        const trans = cache[trimmed] || trimmed;
        const leading = orig.match(/^\s*/)[0];
        const trailing = orig.match(/\s*$/)[0];
        node.nodeValue = leading + trans + trailing;
      });

      // Apply to attributes
      attrMapping.forEach(({ el, attr, trimmed }) => {
        const trans = cache[trimmed] || trimmed;
        el.setAttribute(attr, trans);
      });
    }
  } catch (err) {
    console.error("[DOM Auto-Translator] Translation error:", err);
  } finally {
    isTranslating = false;
  }
};

/**
 * Start Auto-Translator for the given language
 */
export const startDomAutoTranslator = (langCode) => {
  const newLang = (langCode || "en").toLowerCase();

  // If switching languages, restore English baseline first
  if (currentLanguage !== "en" && newLang !== currentLanguage) {
    restoreOriginalDom();
  }
  currentLanguage = newLang;

  if (currentLanguage === "en") {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    restoreOriginalDom();
    return;
  }

  // Initial translation pass immediately
  translateDom(currentLanguage);

  // Setup MutationObserver for dynamic React DOM changes
  if (!observer) {
    observer = new MutationObserver((mutations) => {
      if (isTranslating || currentLanguage === "en") return;

      let shouldRun = false;
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length > 0) {
          shouldRun = true;
          break;
        }
      }

      if (shouldRun) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          if (currentLanguage !== "en") {
            translateDom(currentLanguage);
          }
        }, 15);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
};

/**
 * Stop Auto-Translator
 */
export const stopDomAutoTranslator = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  restoreOriginalDom();
};

export default {
  startDomAutoTranslator,
  stopDomAutoTranslator,
  translateDom,
  restoreOriginalDom
};
