/**
 * ThemeContext — Light/dark theme management.
 *
 * Initialization order (per spec):
 *  1. Read saved preference from localStorage ("craftly-theme").
 *  2. If absent, check window.matchMedia("(prefers-color-scheme: dark)").
 *  3. Apply "light" or "dark" class to the root <html> element.
 *  4. Persist explicit user changes back to localStorage.
 *
 * NOTE: CSS media queries do NOT add classes. This module is the sole
 * authority that writes class names to <html>.
 */

import { useCallback, useEffect, useState } from "react";
import { ThemeContext } from "./theme-context.js";

const STORAGE_KEY = "craftly-theme";

/** @returns {"light"|"dark"} */
function resolveInitialTheme() {
  // 1. Saved preference
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* localStorage unavailable */ }

  // 2. System preference via matchMedia
  try {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch { /* matchMedia unavailable */ }

  // 3. Default
  return "light";
}

/** Apply theme class to <html> element. */
function applyThemeToRoot(theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

/**
 * @param {{ children: React.ReactNode }} props
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const initial = resolveInitialTheme();
    // Apply synchronously during render to avoid flash
    applyThemeToRoot(initial);
    return initial;
  });

  // Keep <html> class in sync whenever theme state changes
  useEffect(() => {
    applyThemeToRoot(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* */ }
      return next;
    });
  }, []);

  const setThemeExplicit = useCallback((/** @type {"light"|"dark"} */ t) => {
    if (t !== "light" && t !== "dark") return;
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* */ }
    setTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeExplicit }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
