/**
 * TerminalPanel — xterm.js terminal UI panel.
 *
 * Uses useTerminal hook.
 * Shows config-error state when VITE_AGENT_URL_TEMPLATE is missing.
 * Shows connection status badge, reconnect and clear buttons.
 */

import { RefreshCw, Trash2, TerminalSquare, AlertTriangle } from "lucide-react";
import PanelHeader from "../../components/ui/PanelHeader.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { useTerminal } from "./useTerminal.js";

/**
 * @param {{ sandbox: { sandboxId: string } }} props
 */
export default function TerminalPanel({ sandbox }) {
  const sandboxId = sandbox?.sandboxId;
  const { containerRef, status, errorMsg, connect, clear } = useTerminal(sandboxId);

  const configError = status === "config-error";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--color-surface)" }}>
      <PanelHeader
        icon={<TerminalSquare size={15} />}
        label="Terminal"
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <StatusBadge status={status === "config-error" ? "error" : status} />
            {!configError && (
              <>
                <button
                  id="terminal-clear-btn"
                  onClick={clear}
                  title="Clear terminal"
                  aria-label="Clear terminal output"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", transition: "color var(--transition-fast)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                >
                  <Trash2 size={13} />
                </button>
                {(status === "disconnected" || status === "error") && (
                  <button
                    id="terminal-reconnect-btn"
                    onClick={connect}
                    title="Reconnect"
                    aria-label="Reconnect terminal"
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", fontSize: "0.6875rem", fontWeight: 600, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", background: "transparent", transition: "all var(--transition-fast)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
                  >
                    <RefreshCw size={11} />
                    Reconnect
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

      {/* Config error state — keep dashboard/auth usable; only this panel shows the error */}
      {configError && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)", padding: "var(--space-6)", textAlign: "center", background: "#0b0f14" }}>
          <AlertTriangle size={24} style={{ color: "#f59e0b" }} />
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "var(--space-2)" }}>
              Agent URL not configured
            </p>
            <p style={{ fontSize: "0.75rem", color: "#64748b", maxWidth: 360, lineHeight: 1.6 }}>
              {errorMsg}
            </p>
          </div>
        </div>
      )}

      {/* xterm container */}
      <div
        ref={containerRef}
        id="terminal-container"
        aria-label="Terminal"
        role="textbox"
        aria-multiline="true"
        style={{
          flex: 1,
          overflow: "hidden",
          display: configError ? "none" : "block",
          padding: "var(--space-2)",
          background: "#0b0f14",
          // Override xterm default styles to match our theme
        }}
      />
    </div>
  );
}
