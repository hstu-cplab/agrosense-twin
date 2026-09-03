import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "agrosense.theme";

/** data-viz tokens resolved to concrete colours for the current theme. */
export interface Palette {
  green: string;
  blue: string;
  sky: string;
  cyan: string;
  amber: string;
  violet: string;
  red: string;
  orange: string;
  lime: string;
  accent: string;
  ink: string;
  inkMuted: string;
  hair: string;
  surface: string;
  canvas: string;
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggle: () => void;
  palette: Palette;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function initialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const q = new URLSearchParams(window.location.search).get("theme");
  if (q === "light" || q === "dark") return q;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "light"; // light-by-default
}

function readPalette(): Palette {
  const fallback: Palette = {
    green: "#15803d",
    blue: "#2563eb",
    sky: "#0369a1",
    cyan: "#0e7490",
    amber: "#b45309",
    violet: "#7c3aed",
    red: "#dc2626",
    orange: "#c2410c",
    lime: "#4d7c0f",
    accent: "#15803d",
    ink: "#2b3830",
    inkMuted: "#566158",
    hair: "#e2e6e2",
    surface: "#ffffff",
    canvas: "#dfe6e6",
  };
  if (typeof window === "undefined") return fallback;
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, def: string) => cs.getPropertyValue(name).trim() || def;
  return {
    green: get("--color-c-green", fallback.green),
    blue: get("--color-c-blue", fallback.blue),
    sky: get("--color-c-sky", fallback.sky),
    cyan: get("--color-c-cyan", fallback.cyan),
    amber: get("--color-c-amber", fallback.amber),
    violet: get("--color-c-violet", fallback.violet),
    red: get("--color-c-red", fallback.red),
    orange: get("--color-c-orange", fallback.orange),
    lime: get("--color-c-lime", fallback.lime),
    accent: get("--color-accent", fallback.accent),
    ink: get("--color-ink", fallback.ink),
    inkMuted: get("--color-ink-muted", fallback.inkMuted),
    hair: get("--color-hair", fallback.hair),
    surface: get("--color-surface", fallback.surface),
    canvas: get("--twin-canvas", fallback.canvas),
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);
  const [palette, setPalette] = useState<Palette>(readPalette);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    // let the browser apply the new custom-property values first
    const id = requestAnimationFrame(() => setPalette(readPalette()));
    return () => cancelAnimationFrame(id);
  }, [theme]);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);
  const toggle = useCallback(
    () => setThemeState((t) => (t === "light" ? "dark" : "light")),
    []
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggle, palette }),
    [theme, setTheme, toggle, palette]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

export function usePalette(): Palette {
  return useTheme().palette;
}
