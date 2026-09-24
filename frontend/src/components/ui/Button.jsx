/**
 * Button — reusable button component.
 *
 * Variants: "primary" | "secondary" | "ghost" | "danger"
 * Sizes:    "sm" | "md" | "lg"
 */

import { Loader2 } from "lucide-react";

const VARIANT_STYLES = {
  primary: {
    background: "var(--color-accent)",
    color: "#fff",
    border: "1px solid var(--color-accent)",
    "--btn-hover-bg": "var(--color-accent-hover)",
  },
  secondary: {
    background: "var(--color-surface-2)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    "--btn-hover-bg": "var(--color-surface-3)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-muted)",
    border: "1px solid transparent",
    "--btn-hover-bg": "var(--color-surface-2)",
  },
  danger: {
    background: "transparent",
    color: "var(--color-error)",
    border: "1px solid var(--color-error)",
    "--btn-hover-bg": "var(--color-error-dim)",
  },
};

const SIZE_STYLES = {
  sm: { padding: "4px 10px", fontSize: "0.75rem", gap: "var(--space-1)", height: 28 },
  md: { padding: "6px 14px", fontSize: "0.8125rem", gap: "var(--space-2)", height: 34 },
  lg: { padding: "10px 20px", fontSize: "0.9375rem", gap: "var(--space-2)", height: 42 },
};

/**
 * @param {{
 *   variant?: "primary"|"secondary"|"ghost"|"danger",
 *   size?: "sm"|"md"|"lg",
 *   loading?: boolean,
 *   icon?: React.ReactNode,
 *   children: React.ReactNode,
 * } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) {
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.secondary;
  const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizeStyle.gap,
        height: sizeStyle.height,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        fontWeight: 500,
        borderRadius: "var(--radius-md)",
        border: variantStyle.border,
        background: variantStyle.background,
        color: variantStyle.color,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.55 : 1,
        transition: "all var(--transition-fast)",
        whiteSpace: "nowrap",
        userSelect: "none",
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.background = variantStyle["--btn-hover-bg"];
          if (variant === "primary") e.currentTarget.style.borderColor = "var(--color-accent-hover)";
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.background = variantStyle.background;
          if (variant === "primary") e.currentTarget.style.borderColor = "var(--color-accent)";
        }
        onMouseLeave?.(e);
      }}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === "lg" ? 16 : 14} className="spin" aria-hidden="true" />
      ) : (
        icon && <span aria-hidden="true" style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      )}
      {children}
    </button>
  );
}
