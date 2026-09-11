import { useCallback, useState } from "react";
import WorkspaceHeader from "../components/layout/WorkspaceHeader.jsx";
import WorkspaceLayout from "../components/layout/WorkspaceLayout.jsx";
import ProjectFilesPanel from "../components/files/ProjectFilesPanel.jsx";
import FileViewerPanel from "../components/files/FileViewerPanel.jsx";
import ChatPanel from "../components/chat/ChatPanel.jsx";
import PreviewPanel from "../components/preview/PreviewPanel.jsx";
import TerminalPanel from "../components/terminal/TerminalPanel.jsx";

/**
 * Workspace — the main developer environment page.
 *
 * Rendered once the sandbox is in "ready" state.
 *
 * Receives the complete sandbox state as a single prop and fans it out
 * to every panel. This is the ONLY place sandbox state enters the workspace
 * component tree — panels do not manage their own sandbox state.
 *
 * Props:
 *   sandbox     — { sandboxId, previewUrl, status } — single source of truth
 *   onNewSandbox — callback to reset state and return to the landing page
 *
 * Panel responsibilities:
 *   ProjectFilesPanel — file tree (left): calls GET /list-files on the agent using sandbox.sandboxId
 *   Center Panel      — toggles between Live Preview and active File Viewer
 *   ChatPanel         — AI chat (right): uses sandbox.sandboxId as projectId
 *   TerminalPanel     — xterm.js + Socket.IO (bottom): uses sandbox.sandboxId for agent URL
 */
export default function Workspace({ sandbox = {}, onNewSandbox }) {
  const sandboxId = sandbox?.sandboxId;
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeCenterTab, setActiveCenterTab] = useState("preview"); // "preview" | "code"
  const [prevSandboxId, setPrevSandboxId] = useState(sandboxId);

  // Reset open file when sandbox changes (recommended React pattern for prop-dependent state reset)
  if (prevSandboxId !== sandboxId) {
    setPrevSandboxId(sandboxId);
    setSelectedFile(null);
    setActiveCenterTab("preview");
  }


  const handleSelectFile = useCallback((filePath) => {
    setSelectedFile(filePath);
    setActiveCenterTab("code");
  }, []);

  const handleCloseFile = useCallback(() => {
    setSelectedFile(null);
    setActiveCenterTab("preview");
  }, []);

  return (
    <div
      id="craftly-workspace"
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--color-bg)",
      }}
    >
      {/* Fixed top bar */}
      <WorkspaceHeader
        sandbox={sandbox}
        onNewSandbox={onNewSandbox}
      />

      {/* Four-panel resizable layout — fills the remaining height */}
      <WorkspaceLayout
        leftPanel={
          <ProjectFilesPanel
            sandbox={sandbox}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
          />
        }
        centerPanel={
          <div
            id="center-workspace-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Center Tab Bar (shown when a file is open) */}
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
                  gap: 4,
                }}
              >
                {/* Live Preview Tab */}
                <button
                  id="tab-btn-preview"
                  onClick={() => setActiveCenterTab("preview")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 12px",
                    border: "none",
                    borderBottom:
                      activeCenterTab === "preview"
                        ? "2px solid var(--color-accent)"
                        : "2px solid transparent",
                    background:
                      activeCenterTab === "preview"
                        ? "var(--color-bg)"
                        : "transparent",
                    color:
                      activeCenterTab === "preview"
                        ? "var(--color-text)"
                        : "var(--color-text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: activeCenterTab === "preview" ? 600 : 500,
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <BrowserTabIcon />
                  <span>Live Preview</span>
                </button>

                {/* Open File Tab */}
                <div
                  id="tab-btn-file"
                  onClick={() => setActiveCenterTab("code")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 10px",
                    borderBottom:
                      activeCenterTab === "code"
                        ? "2px solid var(--color-accent)"
                        : "2px solid transparent",
                    background:
                      activeCenterTab === "code"
                        ? "var(--color-bg)"
                        : "transparent",
                    color:
                      activeCenterTab === "code"
                        ? "var(--color-text)"
                        : "var(--color-text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: activeCenterTab === "code" ? 600 : 500,
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "all var(--transition-fast)",
                    maxWidth: 200,
                  }}
                >
                  <FileTabIcon name={selectedFile} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={selectedFile}
                  >
                    {selectedFile.split("/").pop()}
                  </span>
                  <button
                    id="tab-close-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseFile();
                    }}
                    title="Close file"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 16,
                      height: 16,
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: "transparent",
                      color: "var(--color-text-muted)",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      lineHeight: 1,
                      marginLeft: 2,
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
                </div>
              </div>
            )}

            {/* Live Preview Panel (kept in DOM to preserve preview state) */}
            <div
              style={{
                display:
                  !selectedFile || activeCenterTab === "preview"
                    ? "flex"
                    : "none",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <PreviewPanel sandbox={sandbox} />
            </div>

            {/* File Viewer Panel (active when viewing code) */}
            {selectedFile && (
              <div
                style={{
                  display: activeCenterTab === "code" ? "flex" : "none",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <FileViewerPanel
                  sandbox={sandbox}
                  filePath={selectedFile}
                  onClose={handleCloseFile}
                />
              </div>
            )}
          </div>
        }
        rightPanel={<ChatPanel sandbox={sandbox} />}
        bottomPanel={<TerminalPanel sandbox={sandbox} />}
      />
    </div>
  );
}

function BrowserTabIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function FileTabIcon({ name = "" }) {
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
      width="12"
      height="12"
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

