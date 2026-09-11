import { useRef } from "react";
import { PanelHeader } from "../chat/ChatPanel.jsx";
import { useTerminal } from "../../hooks/useTerminal.js";

/**
 * TerminalPanel — Real interactive terminal using @xterm/xterm and Socket.IO.
 *
 * Connects to the backend PTY agent at `getAgentUrl(sandbox.sandboxId)`.
 * Emits "terminal-input" and "terminal-resize".
 * Listens for "terminal-output", "terminal-exit", and "terminal-error".
 *
 * @param {{ sandbox: { sandboxId: string, previewUrl: string, status: string } }} props
 */
export default function TerminalPanel({ sandbox = {} }) {
  const sandboxId = sandbox?.sandboxId;
  const terminalContainerRef = useRef(null);

  const { status, errorMessage, reconnect, clearTerminal } = useTerminal(
    sandboxId,
    terminalContainerRef
  );

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return {
          label: "Connected",
          color: "var(--color-success)",
          bg: "var(--color-success-dim)",
          dot: "●",
        };
      case "connecting":
        return {
          label: "Connecting…",
          color: "var(--color-warning)",
          bg: "var(--color-warning-dim)",
          dot: "●",
        };
      case "error":
        return {
          label: "Error",
          color: "var(--color-error)",
          bg: "var(--color-error-dim)",
          dot: "×",
        };
      case "disconnected":
      default:
        return {
          label: "Disconnected",
          color: "var(--color-text-muted)",
          bg: "var(--color-surface-2)",
          dot: "○",
        };
    }
  };

  const statusBadge = getStatusBadge();

  if (!sandboxId) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          background: "var(--color-bg)",
        }}
      >
        <PanelHeader icon={<TerminalIcon />} label="Terminal" />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
            fontSize: "0.8125rem",
          }}
        >
          No active sandbox session.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "var(--color-bg)",
      }}
    >
      {/* ── Terminal Header ── */}
      <PanelHeader
        icon={<TerminalIcon />}
        label="Terminal"
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            {/* Status indicator pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: statusBadge.color,
                background: statusBadge.bg,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                border: `1px solid ${statusBadge.color}`,
              }}
            >
              <span
                style={{
                  fontSize: "0.625rem",
                  lineHeight: 1,
                  animation: status === "connecting" ? "pulseDot 1.5s infinite" : "none",
                }}
              >
                {statusBadge.dot}
              </span>
              {statusBadge.label}
            </span>

            {/* Reconnect button if disconnected or error */}
            {(status === "disconnected" || status === "error") && (
              <button
                id="terminal-reconnect-btn"
                onClick={reconnect}
                title="Reconnect terminal"
                aria-label="Reconnect terminal"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--color-accent)",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                <ReloadIcon />
                Reconnect
              </button>
            )}

            {/* Clear terminal buffer */}
            <button
              id="terminal-clear-btn"
              onClick={clearTerminal}
              title="Clear terminal output"
              aria-label="Clear terminal output"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                border: "none",
                color: "var(--color-text-subtle)",
                cursor: "pointer",
                transition: "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-subtle)")}
            >
              <ClearIcon />
            </button>
          </div>
        }
      />

      {/* ── Error notification banner ── */}
      {errorMessage && status === "error" && (
        <div
          role="alert"
          style={{
            padding: "4px 12px",
            background: "var(--color-error-dim)",
            borderBottom: "1px solid var(--color-error)",
            color: "var(--color-error)",
            fontSize: "0.6875rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Connection error: {errorMessage}</span>
          <button
            onClick={reconnect}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-error)",
              fontWeight: 600,
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "0.6875rem",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── xterm.js DOM Mount Point ── */}
      <div
        ref={terminalContainerRef}
        id="xterm-container"
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          padding: "6px 8px",
          overflow: "hidden",
          background: "#0b0f14",
        }}
      />
    </div>
  );
}

function TerminalIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function ReloadIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
