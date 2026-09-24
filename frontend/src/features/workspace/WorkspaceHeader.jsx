/**
 * WorkspaceHeader — fixed top bar of the builder workspace.
 *
 * Shows: Craftly logo | project title | sandbox status | theme toggle | exit action.
 * Responsive: collapses secondary labels on narrow screens.
 */

import { ArrowLeft, ExternalLink } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ThemeToggle from "../../components/ui/ThemeToggle.jsx";
import Button from "../../components/ui/Button.jsx";

/**
 * @param {{
 *   project: { title: string },
 *   sandbox: { sandboxId: string, previewUrl: string },
 *   sandboxStatus: string,
 *   onExit: () => void,
 * }} props
 */
export default function WorkspaceHeader({ project, sandbox, sandboxStatus, onExit }) {
  return (
    <header
      id="workspace-header"
      style={{
        height: 48,
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "0 var(--space-4)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        zIndex: "var(--z-overlay)",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "linear-gradient(135deg, var(--color-accent), var(--color-violet))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <span
          style={{
            fontSize: "0.9375rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--color-text)",
          }}
        >
          Craftly
        </span>
      </div>

      {/* Divider */}
      <div aria-hidden="true" style={{ width: 1, height: 20, background: "var(--color-border)", flexShrink: 0 }} />

      {/* Project title */}
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--color-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flexShrink: 1,
          minWidth: 0,
        }}
        title={project?.title}
      >
        {project?.title ?? "Untitled project"}
      </div>

      {/* Status badge */}
      <StatusBadge status={sandboxStatus} />

      {/* Spacer */}
      <div style={{ flex: 1, minWidth: 0 }} />

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
        {/* Open preview in new tab — only when backend has returned previewUrl */}
        {sandbox?.previewUrl && (
          <a
            href={sandbox.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open preview in new tab"
            aria-label="Open live preview in new tab"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-text-muted)",
              fontSize: "0.75rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border-focus)";
              e.currentTarget.style.color = "var(--color-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-muted)";
            }}
          >
            <ExternalLink size={12} aria-hidden="true" />
            <span className="header-label">Preview</span>
          </a>
        )}

        <ThemeToggle size="sm" />

        {/* Exit to dashboard */}
        <Button
          id="exit-workspace-btn"
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={13} />}
          onClick={onExit}
          title="Return to dashboard"
          aria-label="Exit workspace and return to dashboard"
        >
          <span className="header-label">Dashboard</span>
        </Button>
      </div>
    </header>
  );
}
