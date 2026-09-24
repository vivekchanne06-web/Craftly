/**
 * FilesPanel — project file tree with search, create, delete, and refresh.
 *
 * Uses the agent API via useFiles hook.
 * Shows config-error state when VITE_AGENT_URL_TEMPLATE is missing.
 */

import { useCallback, useMemo, useState } from "react";
import {
  Folder, FolderOpen, File, ChevronRight, RefreshCw,
  FilePlus, Search, Trash2, AlertTriangle, X
} from "lucide-react";
import PanelHeader from "../../components/ui/PanelHeader.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useFiles } from "./useFiles.js";

const FILE_COLORS = {
  js: "#f7df1e", jsx: "#61dafb", ts: "#3178c6", tsx: "#61dafb",
  html: "#e44d26", css: "#264de4", json: "#cbcb41", md: "#519aba",
  py: "#3572a5", sh: "#89e051", yml: "#cb171e", yaml: "#cb171e", env: "#ffb13b",
};

/**
 * @param {{
 *   sandbox: { sandboxId: string },
 *   selectedFile: string|null,
 *   onSelectFile: (path: string) => void,
 *   refreshToken?: number,
 * }} props
 */
export default function FilesPanel({ sandbox, selectedFile, onSelectFile, refreshToken = 0 }) {
  const sandboxId = sandbox?.sandboxId;
  const { files, status, errorMsg, refresh, handleCreateFile, handleDeleteFile } = useFiles(
    sandboxId,
    refreshToken
  );

  const [search, setSearch] = useState("");
  const [newFilePath, setNewFilePath] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter((f) => f.toLowerCase().includes(q));
  }, [files, search]);

  const handleCreate = useCallback(async () => {
    const path = newFilePath.trim();
    if (!path) return;
    setCreating(true);
    setCreateError(null);
    try {
      await handleCreateFile(path);
      setNewFilePath("");
      setShowNewFile(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }, [newFilePath, handleCreateFile]);

  const handleDelete = useCallback(async (path) => {
    setDeleting(true);
    try {
      await handleDeleteFile(path);
      setDeleteConfirm(null);
    } catch { /* silently fail for now */ }
    finally { setDeleting(false); }
  }, [handleDeleteFile]);

  const configError = status === "config-error";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--color-surface)" }}>
      <PanelHeader
        icon={<Folder size={15} />}
        label="Files"
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {!configError && (
              <button
                title="New file"
                aria-label="Create new file"
                onClick={() => setShowNewFile((v) => !v)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", transition: "color var(--transition-fast)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
              >
                <FilePlus size={13} />
              </button>
            )}
            <button
              id="files-refresh-btn"
              title="Refresh files"
              aria-label="Refresh file list"
              onClick={refresh}
              disabled={status === "loading" || configError}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", opacity: status === "loading" || configError ? 0.4 : 1, transition: "color var(--transition-fast)" }}
              onMouseEnter={(e) => { if (status !== "loading") e.currentTarget.style.color = "var(--color-text)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
            >
              <RefreshCw size={12} className={status === "loading" ? "spin" : undefined} />
            </button>
          </div>
        }
      />

      {/* Config error */}
      {configError && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", textAlign: "center", gap: "var(--space-3)" }}>
          <AlertTriangle size={22} style={{ color: "var(--color-warning)" }} />
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.5, maxWidth: 200 }}>{errorMsg}</p>
        </div>
      )}

      {/* New file input */}
      {showNewFile && !configError && (
        <div style={{ padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <input
            autoFocus
            type="text"
            placeholder="src/NewFile.jsx"
            value={newFilePath}
            onChange={(e) => { setNewFilePath(e.target.value); setCreateError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowNewFile(false); }}
            style={{ width: "100%", padding: "5px var(--space-2)", fontSize: "0.75rem", borderRadius: "var(--radius-sm)", border: `1px solid ${createError ? "var(--color-error)" : "var(--color-border)"}`, background: "var(--color-surface-2)", color: "var(--color-text)", outline: "none" }}
          />
          {createError && <p style={{ fontSize: "0.6875rem", color: "var(--color-error)" }}>{createError}</p>}
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button onClick={handleCreate} disabled={creating || !newFilePath.trim()}
              style={{ flex: 1, padding: "4px", fontSize: "0.6875rem", fontWeight: 600, borderRadius: "var(--radius-sm)", background: "var(--color-accent)", color: "#fff", opacity: creating || !newFilePath.trim() ? 0.5 : 1 }}>
              {creating ? "Creating…" : "Create"}
            </button>
            <button onClick={() => { setShowNewFile(false); setCreateError(null); }}
              style={{ padding: "4px 8px", fontSize: "0.6875rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {status === "ready" && files.length > 3 && (
        <div style={{ padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)", pointerEvents: "none" }} />
            <input
              type="search"
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search files"
              style={{ width: "100%", padding: "5px 8px 5px 26px", fontSize: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface-2)", color: "var(--color-text)", outline: "none" }}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search"
                style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)" }}>
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* States */}
      {!sandboxId && <Empty icon={<Folder size={24} />} text="No active sandbox." />}
      {sandboxId && status === "loading" && !files.length && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-3)" }}>
          <Spinner size={18} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Loading files…</span>
        </div>
      )}
      {sandboxId && status === "error" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", padding: "var(--space-4)", textAlign: "center" }}>
          <AlertTriangle size={20} style={{ color: "var(--color-error)" }} />
          <p style={{ fontSize: "0.75rem", color: "var(--color-error)", lineHeight: 1.5, maxWidth: 200 }}>{errorMsg}</p>
          <button id="files-retry-btn" onClick={refresh} style={{ fontSize: "0.75rem", color: "var(--color-accent)", textDecoration: "underline", background: "none", border: "none" }}>Retry</button>
        </div>
      )}

      {/* File tree */}
      {sandboxId && status === "ready" && (
        filteredFiles.length === 0 ? (
          <Empty icon={<File size={20} />} text={search ? "No files match your search." : "No files found."} />
        ) : (
          <div className="panel-scroll" style={{ padding: "var(--space-2) 0" }}>
            <FileTree
              files={filteredFiles}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              onDeleteRequest={setDeleteConfirm}
            />
          </div>
        )
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm file deletion"
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, padding: "var(--space-4)" }}
        >
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)", maxWidth: 280, width: "100%" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>Delete file?</p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "var(--space-4)", wordBreak: "break-all" }}>{deleteConfirm}</p>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                style={{ flex: 1, padding: "6px", fontSize: "0.8125rem", fontWeight: 600, borderRadius: "var(--radius-md)", background: "var(--color-error)", color: "#fff", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "6px", fontSize: "0.8125rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", color: "var(--color-text-muted)", fontSize: "0.8125rem", padding: "var(--space-4)", textAlign: "center" }}>
      <span style={{ opacity: 0.5 }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function buildTree(paths) {
  const root = {};
  for (const p of paths) {
    const parts = p.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) { node[part] = null; }
      else { if (!node[part] || node[part] === null) node[part] = {}; node = node[part]; }
    }
  }
  return root;
}

function FileTree({ files, selectedFile, onSelectFile, onDeleteRequest }) {
  const tree = buildTree(files);
  return (
    <>
      {Object.keys(tree)
        .sort((a, b) => {
          const aDir = tree[a] !== null;
          const bDir = tree[b] !== null;
          if (aDir && !bDir) return -1;
          if (!aDir && bDir) return 1;
          return a.localeCompare(b);
        })
        .map((key) => (
          <TreeNode
            key={key}
            name={key}
            node={tree[key]}
            depth={0}
            defaultOpen
            pathPrefix=""
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
            onDeleteRequest={onDeleteRequest}
          />
        ))}
    </>
  );
}

function TreeNode({ name, node, depth, defaultOpen, pathPrefix, selectedFile, onSelectFile, onDeleteRequest }) {
  const isDir = node !== null && typeof node === "object";
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);
  const indent = depth * 12 + 8;
  const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name;
  const isSelected = !isDir && selectedFile === fullPath;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  if (!isDir) {
    return (
      <div
        id={`file-node-${fullPath.replace(/[^a-zA-Z0-9-_]/g, "-")}`}
        title={fullPath}
        onClick={() => onSelectFile(fullPath)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingLeft: indent,
          paddingRight: 8,
          paddingTop: 3,
          paddingBottom: 3,
          cursor: "pointer",
          fontSize: "0.75rem",
          color: isSelected ? "var(--color-accent)" : "var(--color-text-muted)",
          background: isSelected ? "var(--color-accent-subtle)" : hovered ? "var(--color-surface-2)" : "transparent",
          fontWeight: isSelected ? 600 : 400,
          borderLeft: isSelected ? "2px solid var(--color-accent)" : "2px solid transparent",
          margin: "0 4px",
          borderRadius: "var(--radius-sm)",
          userSelect: "none",
          transition: "all var(--transition-fast)",
          position: "relative",
        }}
      >
        <File size={12} style={{ color: FILE_COLORS[ext] || "var(--color-text-subtle)", flexShrink: 0 }} aria-hidden="true" />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{name}</span>
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(fullPath); }}
            title={`Delete ${name}`}
            aria-label={`Delete ${name}`}
            style={{ display: "flex", alignItems: "center", color: "var(--color-text-subtle)", opacity: 0.7, flexShrink: 0 }}
            onMouseEnter={(e) => { e.stopPropagation(); e.currentTarget.style.color = "var(--color-error)"; e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-subtle)"; e.currentTarget.style.opacity = "0.7"; }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    );
  }

  const children = Object.keys(node).sort((a, b) => {
    const aD = node[a] !== null; const bD = node[b] !== null;
    if (aD && !bD) return -1; if (!aD && bD) return 1; return a.localeCompare(b);
  });

  return (
    <div>
      <div
        onClick={() => setOpen((o) => !o)}
        title={fullPath}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          paddingLeft: indent,
          paddingRight: 8,
          paddingTop: 3,
          paddingBottom: 3,
          cursor: "pointer",
          fontSize: "0.75rem",
          color: "var(--color-text)",
          fontWeight: 500,
          borderRadius: "var(--radius-sm)",
          margin: "0 4px",
          userSelect: "none",
          background: "transparent",
          transition: "background var(--transition-fast)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <ChevronRight size={10} style={{ flexShrink: 0, transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 150ms ease", color: "var(--color-text-subtle)" }} aria-hidden="true" />
        {open
          ? <FolderOpen size={13} style={{ color: "var(--color-accent)", flexShrink: 0 }} aria-hidden="true" />
          : <Folder size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} aria-hidden="true" />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{name}</span>
      </div>
      {open && children.map((key) => (
        <TreeNode
          key={key}
          name={key}
          node={node[key]}
          depth={depth + 1}
          defaultOpen={false}
          pathPrefix={fullPath}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          onDeleteRequest={onDeleteRequest}
        />
      ))}
    </div>
  );
}
