import { useContext } from "react";
import { ThemeContext } from "./theme-context.js";

/**
 * Hook to access current theme, toggleTheme, and setTheme.
 *
 * @returns {{ theme: "light"|"dark", toggleTheme: () => void, setTheme: (t: string) => void }}
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
