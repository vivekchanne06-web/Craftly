/** ThemeToggle — sun/moon icon button for light/dark switching. */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../app/useTheme.js";

/**
 * @param {{ size?: "sm"|"md" }} props
 */
export default function ThemeToggle({ size = "md" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const iconSize = size === "sm" ? 14 : 16;
  const btnSize = size === "sm" ? 28 : 34;

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: btnSize,
        height: btnSize,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "transparent",
        color: "var(--color-text-muted)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--color-surface-2)";
        e.currentTarget.style.color = "var(--color-text)";
        e.currentTarget.style.borderColor = "var(--color-border-focus)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--color-text-muted)";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      {isDark ? (
        <Sun size={iconSize} aria-hidden="true" />
      ) : (
        <Moon size={iconSize} aria-hidden="true" />
      )}
    </button>
  );
}
