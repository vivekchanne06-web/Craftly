/**
 * WorkspacePage — the main builder environment.
 *
 * Receives project + sandbox from app state.
 * Composes header + 4-panel layout + all feature panels.
 * Fans sandbox data to panels; panels never manage their own sandbox state.
 */

import { useCallback, useState } from "react";
import WorkspaceHeader from "./WorkspaceHeader.jsx";
import WorkspaceLayout from "./WorkspaceLayout.jsx";
import FilesPanel from "../files/FilesPanel.jsx";
import MonacoEditor from "../files/MonacoEditor.jsx";
import ChatPanel from "../ai/ChatPanel.jsx";
import PreviewPanel from "../preview/PreviewPanel.jsx";
import TerminalPanel from "../terminal/TerminalPanel.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useSandboxReadiness } from "./useSandboxReadiness.js";

/**
 * @param {{
 *   project: object,
 *   sandbox: { sandboxId: string, previewUrl: string },
 *   onExit: () => void,
 * }} props
 */
export default function WorkspacePage({ project, sandbox, onExit }) {
  const sandboxId = sandbox?.sandboxId;
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeCenterTab, setActiveCenterTab] = useState("preview"); // "preview" | "editor"
  const [refreshToken, setRefreshToken] = useState(0);
  const readiness = useSandboxReadiness(sandboxId);

  const handleSelectFile = useCallback((filePath) => {
    setSelectedFile(filePath);
    setActiveCenterTab("editor");
  }, []);

  const handleCloseFile = useCallback(() => {
    setSelectedFile(null);
    setActiveCenterTab("preview");
  }, []);

  /** Triggered by AI on stream complete — refreshes files and preview. */
  const handleAiComplete = useCallback(() => {
    setRefreshToken((t) => t + 1);
  }, []);

  if (readiness.status !== "ready") {
    const hasFailed = readiness.status === "error" || readiness.status === "config-error";

    return (
      <div
        id="craftly-workspace"
        style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--color-bg)" }}
      >
        <WorkspaceHeader
          project={project}
          sandbox={sandbox}
          sandboxStatus={hasFailed ? "error" : "starting"}
          onExit={onExit}
        />
        <main
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-6)" }}
          aria-live="polite"
        >
          <div
            style={{ maxWidth: 440, width: "100%", padding: "var(--space-8)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)", boxShadow: "var(--shadow-md)", textAlign: "center" }}
          >
            {!hasFailed && <Spinner size={24} />}
            <h1 style={{ marginTop: "var(--space-4)", fontSize: "1.125rem", color: "var(--color-text)" }}>
              {hasFailed ? "Sandbox connection failed" : "Preparing your workspace"}
            </h1>
            <p style={{ marginTop: "var(--space-2)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              {hasFailed
                ? readiness.error
                : "Starting the editor, terminal, files, and live preview. This usually takes a few seconds."}
            </p>
            {!hasFailed && (
              <p style={{ marginTop: "var(--space-3)", fontSize: "0.75rem", color: "var(--color-text-subtle)" }}>
                Connection check {readiness.attempt} of 30
              </p>
            )}
            {hasFailed && (
              <button
                type="button"
                onClick={readiness.retry}
                style={{ marginTop: "var(--space-5)", padding: "8px 14px", borderRadius: "var(--radius-md)", background: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 600 }}
              >
                Try again
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  const centerPanel = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>
      {/* Center tab bar */}
      {selectedFile && (
        <div
          id="center-tab-bar"
          style={{
            display: "flex",
            alignItems: "stretch",
            height: 34,
            minHeight: 34,
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            padding: "0 var(--space-2)",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <CenterTab
            id="tab-preview"
            active={activeCenterTab === "preview"}
            onClick={() => setActiveCenterTab("preview")}
            label="Live Preview"
            icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            }
          />
          <CenterTab
            id="tab-editor"
            active={activeCenterTab === "editor"}
            onClick={() => setActiveCenterTab("editor")}
            label={selectedFile.split("/").pop()}
            icon={<FileTabIcon name={selectedFile} />}
            onClose={handleCloseFile}
            closeable
          />
        </div>
      )}

      {/* Preview panel — kept mounted to preserve iframe state */}
      <div style={{
        display: (!selectedFile || activeCenterTab === "preview") ? "flex" : "none",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}>
        <PreviewPanel sandbox={sandbox} refreshToken={refreshToken} />
      </div>

      {/* Monaco editor */}
      {selectedFile && (
        <div style={{
          display: activeCenterTab === "editor" ? "flex" : "none",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}>
          <MonacoEditor
            sandbox={sandbox}
            filePath={selectedFile}
            onClose={handleCloseFile}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      id="craftly-workspace"
      style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--color-bg)" }}
    >
      <WorkspaceHeader
        project={project}
        sandbox={sandbox}
        sandboxStatus={readiness.status}
        onExit={onExit}
      />
      <WorkspaceLayout
        leftPanel={
          <FilesPanel
            sandbox={sandbox}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
            refreshToken={refreshToken}
          />
        }
        centerPanel={centerPanel}
        rightPanel={
          <ChatPanel
            sandbox={sandbox}
            onComplete={handleAiComplete}
          />
        }
        bottomPanel={<TerminalPanel sandbox={sandbox} />}
      />
    </div>
  );
}

function CenterTab({ id, active, onClick, label, icon, closeable, onClose }) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "0 10px",
        fontSize: "0.75rem",
        fontWeight: active ? 600 : 400,
        color: active ? "var(--color-text)" : "var(--color-text-muted)",
        borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
        background: active ? "var(--color-bg)" : "transparent",
        cursor: "pointer",
        userSelect: "none",
        transition: "all var(--transition-fast)",
        maxWidth: 200,
        flexShrink: 0,
      }}
    >
      {icon}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {closeable && onClose && (
        <button
          id="tab-close-file-btn"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Close file tab"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            borderRadius: 2,
            color: "var(--color-text-muted)",
            marginLeft: 2,
            flexShrink: 0,
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-surface-3)";
            e.currentTarget.style.color = "var(--color-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          ×
        </button>
      )}
    </button>
  );
}

function FileTabIcon({ name = "" }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const colors = {
    js: "#f7df1e", jsx: "#61dafb", ts: "#3178c6", tsx: "#61dafb",
    html: "#e44d26", css: "#264de4", json: "#cbcb41", md: "#519aba",
    py: "#3572a5", sh: "#89e051", yml: "#cb171e", yaml: "#cb171e",
  };
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke={colors[ext] || "var(--color-text-subtle)"} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
