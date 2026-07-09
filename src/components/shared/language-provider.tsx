"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_LANG,
  getDict,
  type Dict,
  type Lang,
} from "@/lib/i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  dict: Dict;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "mca-lang";

// --- external store: language persisted in localStorage ---
const listeners = new Set<() => void>();

function readStoredLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "bn" ? stored : DEFAULT_LANG;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function writeLang(next: Lang) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  listeners.forEach((l) => l());
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Reads persisted language without a setState-in-effect. Returns the server
  // snapshot (DEFAULT_LANG) during hydration, then the stored value.
  const lang = useSyncExternalStore(
    subscribe,
    readStoredLang,
    () => DEFAULT_LANG,
  );

  // Keep <html lang> in sync with the active language (SEO + screen readers).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    writeLang(next);
  }, []);

  const toggleLang = useCallback(() => {
    writeLang(readStoredLang() === "en" ? "bn" : "en");
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang, dict: getDict(lang) }),
    [lang, setLang, toggleLang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

/** Convenience hook: returns just the active dictionary. */
export function useDict(): Dict {
  return useLanguage().dict;
}
