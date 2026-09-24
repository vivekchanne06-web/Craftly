/**
 * PreviewPanel — live preview iframe.
 *
 * Uses previewUrl exactly as returned by the backend.
 * Never constructs or modifies the URL.
 * Shows loading, error, and config-error states.
 */

import { useCallback, useRef, useState } from "react";
import { RefreshCw, ExternalLink, Monitor, AlertTriangle } from "lucide-react";
import PanelHeader from "../../components/ui/PanelHeader.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

/**
 * @param {{
 *   sandbox: { previewUrl: string },
 *   refreshToken?: number,
 * }} props
 */
export default function PreviewPanel({ sandbox, refreshToken = 0 }) {
  const previewUrl = sandbox?.previewUrl;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Refresh when AI completes (refreshToken increments)
  const [prevToken, setPrevToken] = useState(refreshToken);
  if (prevToken !== refreshToken) {
    setPrevToken(refreshToken);
    setIframeKey((k) => k + 1);
    setLoading(true);
    setError(false);
  }

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1);
    setLoading(true);
    setError(false);
  }, []);

  if (!previewUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--color-bg)" }}>
        <PanelHeader icon={<Monitor size={15} />} label="Live Preview" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)", color: "var(--color-text-muted)", padding: "var(--space-6)", textAlign: "center" }}>
          <AlertTriangle size={24} style={{ opacity: 0.4 }} />
          <div>
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>No preview available</p>
            <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, maxWidth: 320 }}>
              The backend has not returned a preview URL. This may indicate a sandbox provisioning issue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--color-bg)" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 var(--space-3)", height: 36, minHeight: 36, borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-2)", gap: "var(--space-2)", flexShrink: 0 }}>
        <Monitor size={13} style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Live Preview
        </span>
        {loading && <Spinner size={12} />}
        <button
          id="preview-refresh-btn"
          onClick={handleRefresh}
          title="Refresh preview"
          aria-label="Refresh live preview"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-muted)", transition: "all var(--transition-fast)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-3)"; e.currentTarget.style.color = "var(--color-text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
        >
          <RefreshCw size={12} />
        </button>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="preview-new-tab-link"
          title="Open in new tab"
          aria-label="Open preview in new tab"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", transition: "all var(--transition-fast)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-3)"; e.currentTarget.style.color = "var(--color-text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Preview iframe */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {loading && !error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-3)", background: "var(--color-bg)", zIndex: 1, pointerEvents: "none" }}>
            <Spinner size={20} />
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Loading preview…</span>
          </div>
        )}
        {error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-4)", background: "var(--color-bg)", zIndex: 1, padding: "var(--space-6)", textAlign: "center" }}>
            <AlertTriangle size={24} style={{ color: "var(--color-error)" }} />
            <div>
              <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>Preview unavailable</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                The preview could not load. The sandbox may still be starting up.
              </p>
            </div>
            <button onClick={handleRefresh} style={{ fontSize: "0.8125rem", color: "var(--color-accent)", textDecoration: "underline", background: "none", border: "none" }}>
              Retry
            </button>
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={previewUrl}
          title="Live preview"
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      </div>
    </div>
  );
}
