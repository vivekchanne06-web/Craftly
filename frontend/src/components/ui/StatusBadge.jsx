/** StatusBadge — colored pill for sandbox/connection status. */

const CONFIG = {
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
  starting: {
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
  connected: {
    label: "Connected",
    color: "var(--color-success)",
    bg: "var(--color-success-dim)",
    border: "var(--color-success)",
    dot: "var(--color-success)",
    pulse: true,
  },
  connecting: {
    label: "Connecting…",
    color: "var(--color-warning)",
    bg: "var(--color-warning-dim)",
    border: "var(--color-warning)",
    dot: "var(--color-warning)",
    pulse: true,
  },
  disconnected: {
    label: "Disconnected",
    color: "var(--color-text-muted)",
    bg: "var(--color-surface-2)",
    border: "var(--color-border)",
    dot: "var(--color-text-muted)",
    pulse: false,
  },
};

/**
 * @param {{ status: string }} props
 */
export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? CONFIG.idle;

  return (
    <div
      role="status"
      aria-label={`Status: ${cfg.label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: "var(--radius-full)",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        fontSize: "0.6875rem",
        fontWeight: 600,
        color: cfg.color,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden="true"
        className={cfg.pulse ? "pulse-dot" : undefined}
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "var(--radius-full)",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </div>
  );
}
