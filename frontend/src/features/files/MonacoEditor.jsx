/**
 * MonacoEditor — Code editor panel using @monaco-editor/react.
 *
 * Features:
 *  - Language detection from file extension
 *  - Dirty-state indicator (unsaved dot)
 *  - Ctrl+S / Cmd+S save shortcut
 *  - Explicit Save button
 *  - Unsaved-change warning when closed
 *  - Loading, error, and config-error states
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Save, RefreshCw, X, AlertTriangle } from "lucide-react";
import { readFile, updateFile } from "../../lib/api/agent.js";
import { validateAgentConfig } from "../../lib/config/env.js";
import { useTheme } from "../../app/useTheme.js";
import Spinner from "../../components/ui/Spinner.jsx";

const LANG_MAP = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  html: "html", css: "css", json: "json", md: "markdown", py: "python",
  sh: "shell", bash: "shell", yml: "yaml", yaml: "yaml", toml: "ini",
  env: "plaintext", txt: "plaintext",
};

function detectLanguage(filePath) {
  const ext = filePath?.split(".").pop()?.toLowerCase();
  return LANG_MAP[ext] || "plaintext";
}

/**
 * @param {{
 *   sandbox: { sandboxId: string },
 *   filePath: string,
 *   onClose: () => void,
 * }} props
 */
export default function MonacoEditor({ sandbox, filePath, onClose }) {
  const sandboxId = sandbox?.sandboxId;
  const { theme } = useTheme();

  const [content, setContent] = useState("");
  const [editorValue, setEditorValue] = useState("");
  const [status, setStatus] = useState("loading"); // idle|loading|ready|error|saving|config-error
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // "saved" | null

  const abortRef = useRef(null);

  // Validate agent config
  const { valid: configValid, error: configError } = validateAgentConfig();

  const [prevPath, setPrevPath] = useState(filePath);
  if (prevPath !== filePath) {
    setPrevPath(filePath);
    setStatus("loading");
    setErrorMsg(null);
    setIsDirty(false);
  }

  const loadFile = useCallback(async () => {
    if (!sandboxId || !filePath || !configValid) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStatus("loading");
    setErrorMsg(null);
    try {
      const text = await readFile(sandboxId, filePath, abortRef.current.signal);
      setContent(text);
      setEditorValue(text);
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      setErrorMsg(err.message || "Failed to load file.");
      setStatus("error");
    }
  }, [sandboxId, filePath, configValid]);

  const handleSave = useCallback(async () => {
    if (!sandboxId || !filePath || !isDirty || status === "saving") return;
    setStatus("saving");
    try {
      await updateFile(sandboxId, filePath, editorValue);
      setContent(editorValue);
      setIsDirty(false);
      setSaveMsg("saved");
      setTimeout(() => setSaveMsg(null), 2500);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Failed to save.");
      setStatus("error");
    }
  }, [sandboxId, filePath, isDirty, editorValue, status]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Close anyway?")) return;
    }
    onClose?.();
  }, [isDirty, onClose]);

  const handleEditorChange = useCallback((value) => {
    setEditorValue(value ?? "");
    setIsDirty((value ?? "") !== content);
  }, [content]);

  useEffect(() => {
    if (!sandboxId || !filePath || !configValid) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    readFile(sandboxId, filePath, ctrl.signal)
      .then((text) => {
        setContent(text);
        setEditorValue(text);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setErrorMsg(err.message || "Failed to load file.");
        setStatus("error");
      });

    return () => ctrl.abort();
  }, [sandboxId, filePath, configValid]);

  // Ctrl+S / Cmd+S handler
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleSave]);

  if (!configValid) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)", padding: "var(--space-6)", textAlign: "center", background: "var(--color-surface)" }}>
        <AlertTriangle size={24} style={{ color: "var(--color-warning)" }} />
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>Agent configuration missing</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", maxWidth: 380, lineHeight: 1.6 }}>{configError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--color-surface)" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 var(--space-3)", height: 36, minHeight: 36, borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-2)", gap: "var(--space-2)", flexShrink: 0 }}>
        {/* Filename + dirty dot */}
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0, fontFamily: "var(--font-mono)" }} title={filePath}>
          {filePath}
        </span>
        {isDirty && (
          <span title="Unsaved changes" aria-label="Unsaved changes" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block", flexShrink: 0 }} />
        )}

        {/* Save status */}
        {saveMsg === "saved" && (
          <span style={{ fontSize: "0.6875rem", color: "var(--color-success)", fontWeight: 600 }}>Saved</span>
        )}

        {/* Actions */}
        <button title="Refresh file from sandbox" onClick={loadFile} disabled={status === "loading"}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-muted)", opacity: status === "loading" ? 0.5 : 1 }}>
          <RefreshCw size={12} className={status === "loading" ? "spin" : undefined} />
        </button>

        <button
          id="editor-save-btn"
          title="Save file (Ctrl+S)"
          aria-label="Save file"
          onClick={handleSave}
          disabled={!isDirty || status === "saving"}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: isDirty ? "var(--color-accent)" : "transparent", color: isDirty ? "#fff" : "var(--color-text-muted)", opacity: !isDirty || status === "saving" ? 0.5 : 1, transition: "all var(--transition-fast)" }}>
          {status === "saving" ? <Spinner size={12} color="currentColor" /> : <Save size={12} />}
          Save
        </button>

        <button onClick={handleClose} aria-label="Close editor" title="Close (warns if unsaved)"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", transition: "all var(--transition-fast)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-3)"; e.currentTarget.style.color = "var(--color-text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; }}>
          <X size={14} />
        </button>
      </div>

      {/* Loading / error states */}
      {status === "loading" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", background: "var(--color-bg)" }}>
          <Spinner size={18} />
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Loading {filePath}…</span>
        </div>
      )}

      {status === "error" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", padding: "var(--space-6)", textAlign: "center" }}>
          <AlertTriangle size={22} style={{ color: "var(--color-error)" }} />
          <p style={{ fontSize: "0.875rem", color: "var(--color-error)", maxWidth: 360 }}>{errorMsg}</p>
          <button id="editor-retry-btn" onClick={loadFile}
            style={{ fontSize: "0.8125rem", color: "var(--color-accent)", textDecoration: "underline", background: "none", border: "none" }}>Retry</button>
        </div>
      )}

      {/* Monaco editor */}
      {(status === "ready" || status === "saving") && (
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          <Editor
            value={editorValue}
            language={detectLanguage(filePath)}
            theme={theme === "dark" ? "vs-dark" : "light"}
            onChange={handleEditorChange}
            options={{
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              lineHeight: 1.6,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "off",
              renderLineHighlight: "line",
              tabSize: 2,
              insertSpaces: true,
              formatOnType: false,
              formatOnPaste: false,
              scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              padding: { top: 12, bottom: 12 },
            }}
            loading={<div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner size={18} /></div>}
          />
        </div>
      )}
    </div>
  );
}
