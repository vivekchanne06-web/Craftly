/**
 * StatusBadge — displays the current sandbox status as a colored pill.
 *
 * @param {{ status: "idle"|"creating"|"ready"|"error" }} props
 */
export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: "var(--radius-full)",
        background: config.bg,
        border: `1px solid ${config.border}`,
        fontSize: "0.75rem",
        fontWeight: 600,
        color: config.color,
        letterSpacing: "0.01em",
        userSelect: "none",
      }}
    >
      <span
        className={config.pulse ? "pulse-dot" : undefined}
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "var(--radius-full)",
          background: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label}
    </div>
  );
}

const STATUS_CONFIG = {
  idle: {
    label: "Idle",
    color: "var(--color-text-muted)",
    bg: "var(--color-surface-2)",
    border: "var(--color-border)",
    dot: "var(--color-text-muted)",
    pulse: false,
  },
  creating: {
    label: "Starting…",
    color: "var(--color-warning)",
    bg: "var(--color-warning-dim)",
    border: "var(--color-warning)",
    dot: "var(--color-warning)",
    pulse: true,
  },
  ready: {
    label: "Running",
    color: "var(--color-success)",
    bg: "var(--color-success-dim)",
    border: "var(--color-success)",
    dot: "var(--color-success)",
    pulse: true,
  },
  error: {
    label: "Error",
    color: "var(--color-error)",
    bg: "var(--color-error-dim)",
    border: "var(--color-error)",
    dot: "var(--color-error)",
    pulse: false,
  },
};
