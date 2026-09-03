import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BN } from "./bn";

export type Lang = "en" | "bn";

const STORAGE_KEY = "agrosense.lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** translate: key IS the English source string; falls back to English. */
  t: (en: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const q = new URLSearchParams(window.location.search).get("lang");
  if (q === "en" || q === "bn") return q;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "bn") return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((l) => (l === "en" ? "bn" : "en")), []);

  const t = useCallback(
    (en: string) => {
      if (lang === "en") return en;
      return BN[en] ?? en;
    },
    [lang]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, toggle, t }),
    [lang, setLang, toggle, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** convenience: just the translate fn */
export function useT(): (en: string) => string {
  return useI18n().t;
}
