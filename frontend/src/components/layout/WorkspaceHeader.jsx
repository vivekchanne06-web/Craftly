import StatusBadge from "../common/StatusBadge.jsx";

/**
 * WorkspaceHeader — the fixed top bar of the Craftly workspace.
 *
 * Displays:
 *  - Craftly logo + name
 *  - Shortened sandbox ID (first 8 chars of the dynamic runtime UUID)
 *  - Sandbox status badge
 *  - Action buttons: New Sandbox
 *
 * Props:
 *  sandbox    — { sandboxId, previewUrl, status } — the runtime sandbox state
 *  onNewSandbox — callback to reset and return to the landing page
 *
 * The sandboxId displayed here is always the runtime value from the API.
 * It is NEVER hardcoded.
 */
export default function WorkspaceHeader({ sandbox = {}, onNewSandbox }) {
  // Show only first 8 chars of the runtime sandboxId for readability.
  // e.g. "01a084bd" from a full "<uuid-v7>" — never hardcoded.
  const shortId = sandbox?.sandboxId
    ? sandbox.sandboxId.slice(0, 8)
    : "———";

  return (
    <header
      id="workspace-header"
      style={{
        height: 48,
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "0 var(--space-4)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        zIndex: "var(--z-overlay)",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
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

      {/* ── Divider ── */}
      <div
        aria-hidden="true"
        style={{
          width: 1,
          height: 20,
          background: "var(--color-border)",
          flexShrink: 0,
        }}
      />

      {/* ── Sandbox ID ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-subtle)",
            fontWeight: 500,
          }}
        >
          Sandbox
        </span>
        <code
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "1px 6px",
          }}
          title={sandbox.sandboxId ?? "No active sandbox"}
        >
          {shortId}
        </code>
      </div>

      {/* ── Status badge ── */}
      <StatusBadge status={sandbox.status} />

      {/* ── Spacer — pushes actions to the right ── */}
      <div style={{ flex: 1 }} />

      {/* ── Actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        {/* Preview link — opens previewUrl in a new tab */}
        {sandbox.previewUrl && (
          <a
            href={sandbox.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open preview in new tab"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1)",
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
            <ExternalLinkIcon />
            Preview
          </a>
        )}

        {/* New sandbox */}
        <button
          id="new-sandbox-btn"
          onClick={onNewSandbox}
          title="Create a new sandbox and return to the home screen"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
            padding: "5px 10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-text-muted)",
            fontSize: "0.75rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all var(--transition-fast)",
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
          <PlusIcon />
          New Sandbox
        </button>
      </div>
    </header>
  );
}

/* ── Icons ── */

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
