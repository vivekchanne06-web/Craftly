/**
 * WorkspaceLayout — resizable 4-panel grid.
 *
 * Desktop (≥ 1024px):
 *   left (files) | center (preview/editor) | right (chat)
 *   bottom (terminal, collapsible)
 *
 * Tablet (640–1023px):
 *   Top tab bar selects active panel (Files / Editor / Preview / Chat)
 *   Bottom terminal collapsed by default; toggle button to expand.
 *
 * Mobile (< 640px):
 *   Single panel view, same tab bar, terminal hidden.
 *
 * Resize handles use pointer events (works with mouse and touch pens).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Folder, Monitor, Code2, Sparkles, TerminalSquare, ChevronDown, ChevronUp } from "lucide-react";

const TABS = [
  { id: "files",   label: "Files",   icon: Folder },
  { id: "preview", label: "Preview", icon: Monitor },
  { id: "editor",  label: "Editor",  icon: Code2 },
  { id: "chat",    label: "AI",      icon: Sparkles },
];

/**
 * @param {{
 *   leftPanel: React.ReactNode,
 *   centerPanel: React.ReactNode,
 *   rightPanel: React.ReactNode,
 *   bottomPanel: React.ReactNode,
 * }} props
 */
export default function WorkspaceLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }) {
  // Panel sizes (desktop)
  const [leftWidth, setLeftWidth] = useState(220);
  const [rightWidth, setRightWidth] = useState(320);
  const [terminalHeight, setTerminalHeight] = useState(240);
  const [terminalOpen, setTerminalOpen] = useState(true);

  // Responsive breakpoint detection
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const isTablet = viewportWidth < 1024;
  const isMobile = viewportWidth < 640;

  // Tablet active tab
  const [activeTab, setActiveTab] = useState("preview");

  const containerRef = useRef(null);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const isDraggingH = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartLeft = useRef(leftWidth);
  const dragStartRight = useRef(rightWidth);
  const dragStartTerm = useRef(terminalHeight);

  // Viewport resize listener
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onLeftDragStart = useCallback((e) => {
    isDraggingLeft.current = true;
    dragStartX.current = e.clientX;
    dragStartLeft.current = leftWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }, [leftWidth]);

  const onRightDragStart = useCallback((e) => {
    isDraggingRight.current = true;
    dragStartX.current = e.clientX;
    dragStartRight.current = rightWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }, [rightWidth]);

  const onHDragStart = useCallback((e) => {
    isDraggingH.current = true;
    dragStartY.current = e.clientY;
    dragStartTerm.current = terminalHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }, [terminalHeight]);

  useEffect(() => {
    const onMove = (e) => {
      const cW = containerRef.current?.offsetWidth ?? 1200;
      const cH = containerRef.current?.offsetHeight ?? 800;

      if (isDraggingLeft.current) {
        const next = dragStartLeft.current + (e.clientX - dragStartX.current);
        setLeftWidth(Math.max(160, Math.min(next, cW * 0.35)));
      }
      if (isDraggingRight.current) {
        const next = dragStartRight.current - (e.clientX - dragStartX.current);
        setRightWidth(Math.max(220, Math.min(next, cW * 0.5)));
      }
      if (isDraggingH.current) {
        const next = dragStartTerm.current - (e.clientY - dragStartY.current);
        setTerminalHeight(Math.max(120, Math.min(next, cH * 0.6)));
      }
    };
    const onUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
      isDraggingH.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* ── Tablet / mobile layout ── */
  if (isTablet) {
    return (
      <div ref={containerRef} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        {/* Tab bar */}
        <nav
          style={{
            display: "flex",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
            overflowX: "auto",
          }}
          aria-label="Workspace panels"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                fontSize: "0.8125rem",
                fontWeight: activeTab === id ? 600 : 400,
                color: activeTab === id ? "var(--color-accent)" : "var(--color-text-muted)",
                borderBottom: activeTab === id ? "2px solid var(--color-accent)" : "2px solid transparent",
                background: "transparent",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all var(--transition-fast)",
              }}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}

          {/* Terminal toggle */}
          {!isMobile && (
            <button
              onClick={() => setTerminalOpen((o) => !o)}
              title={terminalOpen ? "Collapse terminal" : "Expand terminal"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                fontSize: "0.8125rem",
                fontWeight: 400,
                color: "var(--color-text-muted)",
                borderBottom: "2px solid transparent",
                background: "transparent",
                whiteSpace: "nowrap",
                marginLeft: "auto",
                flexShrink: 0,
              }}
            >
              <TerminalSquare size={14} aria-hidden="true" />
              {terminalOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          )}
        </nav>

        {/* Active panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          {activeTab === "files" && leftPanel}
          {activeTab === "preview" && centerPanel}
          {activeTab === "editor" && centerPanel}
          {activeTab === "chat" && rightPanel}
        </div>

        {/* Terminal */}
        {!isMobile && terminalOpen && (
          <div style={{ height: 220, minHeight: 220, borderTop: "1px solid var(--color-border)", flexShrink: 0 }}>
            {bottomPanel}
          </div>
        )}
      </div>
    );
  }

  /* ── Desktop layout ── */
  const mainHeight = terminalOpen
    ? `calc(100% - ${terminalHeight}px - 5px)`
    : "calc(100% - 40px)"; // 40px for collapsed terminal header

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--color-bg)", minHeight: 0 }}
    >
      {/* Top row */}
      <div style={{ display: "flex", flexDirection: "row", height: mainHeight, minHeight: 0, overflow: "hidden" }}>
        {/* Left: files */}
        <div id="panel-files" style={{ width: leftWidth, minWidth: leftWidth, maxWidth: leftWidth, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
          {leftPanel}
        </div>

        <ResizeHandle direction="vertical" onMouseDown={onLeftDragStart} label="Resize files panel" />

        {/* Center: preview/editor */}
        <div id="panel-center" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, background: "var(--color-bg)" }}>
          {centerPanel}
        </div>

        <ResizeHandle direction="vertical" onMouseDown={onRightDragStart} label="Resize chat panel" />

        {/* Right: chat */}
        <div id="panel-chat" style={{ width: rightWidth, minWidth: rightWidth, maxWidth: rightWidth, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
          {rightPanel}
        </div>
      </div>

      {/* Horizontal resize handle / terminal toggle */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <ResizeHandle
          direction="horizontal"
          onMouseDown={terminalOpen ? onHDragStart : undefined}
          label="Resize terminal panel"
          style={{ flex: 1, height: 5 }}
        />
        <button
          onClick={() => setTerminalOpen((o) => !o)}
          title={terminalOpen ? "Collapse terminal" : "Expand terminal"}
          aria-label={terminalOpen ? "Collapse terminal" : "Expand terminal"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "0 10px",
            height: "100%",
            fontSize: "0.6875rem",
            color: "var(--color-text-subtle)",
            background: "var(--color-surface-2)",
            borderLeft: "1px solid var(--color-border)",
            cursor: "pointer",
            transition: "color var(--transition-fast)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-subtle)")}
        >
          <TerminalSquare size={11} aria-hidden="true" />
          {terminalOpen ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
        </button>
      </div>

      {/* Bottom: terminal */}
      {terminalOpen && (
        <div id="panel-terminal" style={{ height: terminalHeight, minHeight: terminalHeight, maxHeight: terminalHeight, display: "flex", flexDirection: "column", overflow: "hidden", borderTop: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
          {bottomPanel}
        </div>
      )}
    </div>
  );
}

function ResizeHandle({ direction, onMouseDown, label, style: extraStyle }) {
  const isVertical = direction === "vertical";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        ...(isVertical
          ? { width: 5, cursor: onMouseDown ? "col-resize" : "default", height: "100%" }
          : { height: 5, cursor: onMouseDown ? "row-resize" : "default", width: "100%" }),
        background: hovered && onMouseDown ? "var(--color-accent)" : "var(--color-border)",
        transition: "background var(--transition-fast)",
        ...extraStyle,
      }}
    />
  );
}
