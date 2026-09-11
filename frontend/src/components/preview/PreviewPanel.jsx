import { useCallback, useRef, useState } from "react";
import { PanelHeader } from "../chat/ChatPanel.jsx";

/**
 * PreviewPanel — live website preview using the runtime previewUrl.
 *
 * The previewUrl is received EXACTLY as returned by POST /api/sandbox/start.
 * It is NEVER reconstructed from sandboxId, never hardcoded, never modified.
 *
 * Iframe reload prevention:
 *   - React only updates the `src` DOM attribute when previewUrl actually changes.
 *   - We use a ref-based imperative refresh so unrelated parent re-renders
 *     (AI chat updates, terminal output, etc.) never reload the iframe.
 *   - The iframe is NOT keyed on anything that changes frequently.
 *
 * Limitations of iframe error detection:
 *   - Browser `onError` on iframes only fires for complete network failures,
 *     not for HTTP error pages (e.g. sandbox still initializing → 502).
 *   - `onLoad` fires even when the sandbox returns an error page.
 *   - We expose a manual Refresh control so the user can reload once the
 *     sandbox is fully up, without any polling or backend changes.
 *
 * @param {{ sandbox: { sandboxId: string, previewUrl: string, status: string } }} props
 */
export default function PreviewPanel({ sandbox = {} }) {
  const previewUrl = sandbox?.previewUrl;

  const [isLoading, setIsLoading] = useState(Boolean(previewUrl));
  const [loadError, setLoadError] = useState(false);

  const iframeRef = useRef(null);

  const [prevUrl, setPrevUrl] = useState(previewUrl);
  if (prevUrl !== previewUrl) {
    setPrevUrl(previewUrl);
    setIsLoading(Boolean(previewUrl));
    setLoadError(false);
  }

  /** Called when the iframe has finished loading (success or error page). */
  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  /**
   * Called on a complete network failure (DNS resolution failed, connection refused).
   * Note: does NOT fire for HTTP 4xx/5xx responses — those arrive as loaded pages.
   */
  const handleError = useCallback(() => {
    setIsLoading(false);
    setLoadError(true);
  }, []);

  /**
   * Refresh: imperatively reassign the iframe src.
   * Using the ref avoids React re-rendering the iframe (which would unmount/remount it).
   * Cross-origin contentWindow.location.reload() throws — src reassignment is the safe path.
   */
  const handleRefresh = useCallback(() => {
    if (!previewUrl || !iframeRef.current) return;
    setIsLoading(true);
    setLoadError(false);
    // Reassigning the same src forces the browser to reload the page
    iframeRef.current.src = previewUrl;
  }, [previewUrl]);

  /**
   * Open in new tab: uses window.open with the runtime previewUrl directly.
   * noopener prevents the new tab from accessing window.opener.
   */
  const handleOpenInTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  }, [previewUrl]);

  // ── No previewUrl (should not normally happen after sandbox is ready) ──
  if (!previewUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <PanelHeader icon={<BrowserIcon />} label="Live Preview" />
        <NoPreviewState />
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
      {/* ── Panel header ── */}
      <PanelHeader
        icon={<BrowserIcon />}
        label="Live Preview"
        extra={
          <PreviewActions
            previewUrl={previewUrl}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            onOpenInTab={handleOpenInTab}
          />
        }
      />

      {/* ── Address bar ── */}
      <PreviewAddressBar
        previewUrl={previewUrl}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onOpenInTab={handleOpenInTab}
      />

      {/* ── iframe container (position:relative so overlays sit correctly) ── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        {/* Loading overlay — visible while iframe is fetching */}
        {isLoading && !loadError && <LoadingOverlay />}

        {/* Error overlay — shown on network failure */}
        {loadError && (
          <ErrorOverlay
            previewUrl={previewUrl}
            onRefresh={handleRefresh}
          />
        )}

        {/*
         * The iframe itself.
         *
         * Security notes:
         *  - No `sandbox` attribute: the preview is a real web app that needs
         *    full script/form/same-origin capabilities to run correctly.
         *  - referrerPolicy="no-referrer" avoids leaking the Craftly origin URL.
         *  - allow="..." enables standard web platform APIs the preview may use.
         *
         * Reload prevention:
         *  - We do NOT add a `key` prop that changes on re-renders.
         *  - React only touches the DOM src attribute when previewUrl changes.
         *  - Refresh is done imperatively via iframeRef, not by changing src prop.
         */}
        <iframe
          ref={iframeRef}
          src={previewUrl}
          title="Craftly Live Preview"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            // Hide iframe while loading to avoid flash of unstyled content
            opacity: isLoading || loadError ? 0 : 1,
            transition: "opacity 200ms ease",
            background: "#ffffff",
          }}
          referrerPolicy="no-referrer"
          allow="accelerometer; camera; clipboard-read; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; picture-in-picture"
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════ */

/**
 * PreviewAddressBar — shows the runtime previewUrl with refresh + open-tab controls.
 * The URL displayed is always the exact value from the API — never modified.
 */
function PreviewAddressBar({ previewUrl, isLoading, onRefresh, onOpenInTab }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-2) var(--space-3)",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        flexShrink: 0,
      }}
    >
      {/* Refresh button */}
      <IconButton
        id="preview-refresh-btn"
        onClick={onRefresh}
        title="Refresh preview"
        disabled={isLoading}
        aria-label="Refresh preview"
      >
        <RefreshIcon spinning={isLoading} />
      </IconButton>

      {/* URL display pill */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "5px 10px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Connection indicator */}
        <GlobeIcon />

        {/* Runtime previewUrl — exactly as returned by the backend */}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}
          title={previewUrl}
        >
          {previewUrl}
        </span>
      </div>

      {/* Open in new tab */}
      <IconButton
        id="preview-open-tab-btn"
        onClick={onOpenInTab}
        title="Open preview in new tab"
        aria-label="Open preview in new tab"
      >
        <ExternalLinkIcon />
      </IconButton>
    </div>
  );
}

/**
 * PreviewActions — compact action buttons rendered inside the PanelHeader.
 * Hidden at narrow widths to keep the header clean.
 */
function PreviewActions({ onRefresh, onOpenInTab, isLoading }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
      <IconButton
        onClick={onRefresh}
        title="Refresh"
        disabled={isLoading}
        aria-label="Refresh preview"
        compact
      >
        <RefreshIcon spinning={isLoading} />
      </IconButton>
      <IconButton
        onClick={onOpenInTab}
        title="Open in new tab"
        aria-label="Open preview in new tab"
        compact
      >
        <ExternalLinkIcon />
      </IconButton>
    </div>
  );
}

/** Loading overlay — sits above the iframe while it fetches the preview. */
function LoadingOverlay() {
  return (
    <div
      role="status"
      aria-label="Preview loading"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        background: "var(--color-bg)",
        zIndex: 2,
      }}
    >
      {/* Animated spinner */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        style={{ animation: "spin 0.8s linear infinite" }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <span
          className="pulse-dot"
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "var(--radius-full)",
            background: "var(--color-accent)",
          }}
        />
        Loading preview…
      </p>
    </div>
  );
}

/**
 * ErrorOverlay — shown when the iframe fails to load entirely (network error).
 * Provides context and a retry button.
 *
 * Note: iframe `onError` only fires for complete network failures, not HTTP error pages.
 * If the sandbox returned a 502/504, the iframe will show that page (onLoad fires instead).
 */
function ErrorOverlay({ previewUrl, onRefresh }) {
  return (
    <div
      role="alert"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-4)",
        background: "var(--color-bg)",
        zIndex: 2,
        padding: "var(--space-8)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-lg)",
          background: "var(--color-error-dim)",
          border: "1px solid var(--color-error)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-error)",
        }}
      >
        <OfflineIcon />
      </div>

      <div>
        <p
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-2)",
          }}
        >
          Preview unavailable
        </p>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
            lineHeight: 1.5,
            maxWidth: 360,
          }}
        >
          The preview could not be loaded. The sandbox may still be starting up,
          or the preview URL may not be reachable from this browser.
        </p>

        {/* Display the runtime URL for debugging — never hardcoded */}
        <div
          style={{
            margin: "var(--space-3) auto 0",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-text-muted)",
            maxWidth: 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={previewUrl}
        >
          {previewUrl}
        </div>
      </div>

      <button
        id="preview-retry-btn"
        onClick={onRefresh}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "8px 20px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-2)",
          color: "var(--color-text)",
          fontSize: "0.875rem",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all var(--transition-fast)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border-focus)";
          e.currentTarget.style.background = "var(--color-surface-3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.background = "var(--color-surface-2)";
        }}
      >
        <RefreshIcon />
        Try again
      </button>
    </div>
  );
}

/** Shown when no previewUrl is available (should not occur after sandbox is ready). */
function NoPreviewState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        padding: "var(--space-6)",
        color: "var(--color-text-muted)",
      }}
    >
      <BrowserIcon size={32} />
      <p style={{ fontSize: "0.875rem" }}>No preview URL available.</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRIMITIVE COMPONENTS
   ══════════════════════════════════════════════════════════════ */

function IconButton({ id, children, onClick, title, disabled, "aria-label": ariaLabel, compact }) {
  const size = compact ? 24 : 28;
  return (
    <button
      id={id}
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "var(--radius-md)",
        border: compact ? "none" : "1px solid var(--color-border)",
        background: compact ? "transparent" : "var(--color-surface-2)",
        color: disabled ? "var(--color-text-subtle)" : "var(--color-text-muted)",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        transition: "all var(--transition-fast)",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.color = "var(--color-text)";
          if (!compact) e.currentTarget.style.borderColor = "var(--color-border-focus)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = disabled ? "var(--color-text-subtle)" : "var(--color-text-muted)";
        if (!compact) e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   ICONS
   ══════════════════════════════════════════════════════════════ */

function BrowserIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function RefreshIcon({ spinning = false }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={spinning ? { animation: "spin 0.8s linear infinite" } : undefined}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

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

function GlobeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}
