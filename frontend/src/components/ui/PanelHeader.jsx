/** PanelHeader — consistent header bar used across workspace panels. */

/**
 * @param {{
 *   icon?: React.ReactNode,
 *   label: string,
 *   badge?: string,
 *   extra?: React.ReactNode,
 * }} props
 */
export default function PanelHeader({ icon, label, badge, extra }) {
  return (
    <div
      style={{
        height: 40,
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "0 var(--space-3)",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {icon && (
        <span
          aria-hidden="true"
          style={{ color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}
        >
          {icon}
        </span>
      )}
      <span
        style={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1 }} />
      {badge && (
        <span
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            color: "var(--color-accent)",
            background: "var(--color-accent-dim)",
            border: "1px solid var(--color-accent)",
            borderRadius: "var(--radius-full)",
            padding: "1px 7px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {badge}
        </span>
      )}
      {extra}
    </div>
  );
}
