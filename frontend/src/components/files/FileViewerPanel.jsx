import { useCallback, useEffect, useState } from "react";
import { readSandboxFile } from "../../services/sandboxApi.js";

/**
 * FileViewerPanel - displays the content of a file retrieved from the active sandbox.
 *
 * Reads actual file contents via GET /read-files?files=<filePath> from the Agent.
 * Handles loading, error, retry, copy, and binary/image previews.
 *
 * @param {{
 *   sandbox: { sandboxId: string, previewUrl?: string, status?: string },
 *   filePath: string | null,
 *   onClose?: () => void
 * }} props
 */
export default function FileViewerPanel({ sandbox = {}, filePath, onClose }) {
  const sandboxId = sandbox?.sandboxId;
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const isImage = isImageFile(filePath);

  const doFetch = useCallback(
    async (signal) => {
      if (!sandboxId || !filePath) {
        setContent("");
        setStatus("idle");
        setErrorMsg(null);
        return;
      }

      setStatus("loading");
      setErrorMsg(null);

      try {
        const text = await readSandboxFile(sandboxId, filePath, signal);
        setContent(text);
        setStatus("ready");
      } catch (err) {
        if (err.name === "AbortError") return;
        setErrorMsg(err.message || `Failed to read file ${filePath}`);
        setStatus("error");
      }
    },
    [sandboxId, filePath]
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    doFetch(controller.signal);
    return () => controller.abort();
  }, [doFetch]);

  const handleCopy = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  const handleRefresh = useCallback(() => {
    doFetch(undefined);
  }, [doFetch]);

  if (!filePath) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-3)",
          color: "var(--color-text-muted)",
          background: "var(--color-surface)",
          fontSize: "0.875rem",
        }}
      >
        <FileCodeIcon size={32} />
        <span>Select a file from the Project Files tree to view its contents.</span>
      </div>
    );
  }

  const lines = content ? content.split("\n") : [];
  const lineCount = lines.length;

  return (
    <div
      id="file-viewer-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "var(--color-surface)",
      }}
    >
      {/* File Toolbar Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 var(--space-3)",
          height: 38,
          minHeight: 38,
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-2)",
        }}
      >
        {/* Left: File name + icon + stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
          <FileIcon name={filePath} />
          <span
            id="file-viewer-path"
            title={filePath}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {filePath}
          </span>

          {status === "ready" && !isImage && (
            <span
              style={{
                fontSize: "0.6875rem",
                color: "var(--color-text-subtle)",
                background: "var(--color-surface)",
                padding: "1px 6px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {status === "ready" && !isImage && (
            <button
              id="file-viewer-copy-btn"
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy file contents"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: copied ? "var(--color-success-bg, rgba(34,197,94,0.1))" : "var(--color-surface)",
                color: copied ? "var(--color-success)" : "var(--color-text-muted)",
                fontSize: "0.75rem",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}

          <button
            id="file-viewer-refresh-btn"
            onClick={handleRefresh}
            disabled={status === "loading"}
            title="Refresh file content"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              cursor: status === "loading" ? "not-allowed" : "pointer",
              opacity: status === "loading" ? 0.5 : 1,
            }}
          >
            <RefreshIcon spinning={status === "loading"} />
          </button>

          {onClose && (
            <button
              id="file-viewer-close-btn"
              onClick={onClose}
              title="Close file viewer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-text)";
                e.currentTarget.style.background = "var(--color-surface-3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Body Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {status === "loading" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-3)",
              color: "var(--color-text-muted)",
            }}
          >
            <svg
              width="24"
              height="24"
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
            <span style={{ fontSize: "0.8125rem" }}>Loading {filePath}...</span>
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-3)",
              padding: "var(--space-6)",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "1.75rem", color: "var(--color-error)" }}>!</span>
            <p style={{ fontSize: "0.875rem", color: "var(--color-error)", maxWidth: 360 }}>
              {errorMsg}
            </p>
            <button
              id="file-viewer-retry-btn"
              onClick={handleRefresh}
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-accent)",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "6px 16px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {status === "ready" && isImage && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-4)",
              padding: "var(--space-6)",
              background: "var(--color-bg)",
            }}
          >
            {sandbox?.previewUrl ? (
              <img
                src={`${sandbox.previewUrl}/${filePath.replace(/^public\//, "")}`}
                alt={filePath}
                style={{
                  maxWidth: "80%",
                  maxHeight: "70%",
                  objectFit: "contain",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <div style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
              <p style={{ fontWeight: 500, color: "var(--color-text)" }}>Binary Image File</p>
              <p style={{ marginTop: 4 }}>{filePath}</p>
            </div>
          </div>
        )}

        {status === "ready" && !isImage && (
          <div
            id="file-viewer-code-container"
            style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              lineHeight: 1.6,
              background: "var(--color-bg)",
            }}
          >
            {/* Line Numbers Gutter */}
            <div
              style={{
                userSelect: "none",
                textAlign: "right",
                padding: "var(--space-3) var(--space-3) var(--space-3) var(--space-2)",
                color: "var(--color-text-subtle)",
                borderRight: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                minWidth: 42,
                flexShrink: 0,
              }}
            >
              {lines.map((_, i) => (
                <div key={i} style={{ height: "1.6em" }}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Content */}
            <pre
              style={{
                margin: 0,
                padding: "var(--space-3)",
                flex: 1,
                color: "var(--color-text)",
                whiteSpace: "pre",
                wordBreak: "normal",
                tabSize: 2,
              }}
            >
              <code>{content}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function isImageFile(path) {
  if (!path) return false;
  const ext = path.split(".").pop()?.toLowerCase();
  return ["png", "jpg", "jpeg", "gif", "webp", "ico"].includes(ext);
}

function FileIcon({ name = "" }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const colorMap = {
    js: "#f7df1e",
    jsx: "#61dafb",
    ts: "#3178c6",
    tsx: "#61dafb",
    html: "#e44d26",
    css: "#264de4",
    json: "#cbcb41",
    md: "#519aba",
    py: "#3572a5",
    sh: "#89e051",
    yml: "#cb171e",
    yaml: "#cb171e",
    env: "#ffb13b",
    svg: "#ff9900",
  };
  const color = colorMap[ext] || "var(--color-text-subtle)";
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function FileCodeIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="10 13 8 15 10 17" />
      <polyline points="14 13 16 15 14 17" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={spinning ? { animation: "spin 0.8s linear infinite" } : undefined}
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
