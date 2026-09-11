import { useCallback, useEffect, useRef, useState } from "react";

/**
 * WorkspaceLayout — four-panel resizable grid.
 *
 * Structure (after header):
 *
 *  ┌─────────────┬──────────────────────┬─────────────┐
 *  │             │                      │             │
 *  │  LEFT       │  CENTER (preview)    │  RIGHT      │
 *  │  (files)    │                      │  (chat)     │
 *  │             │                      │             │
 *  ├─────────────┴──────────────────────┴─────────────┤
 *  │  BOTTOM (terminal)                               │
 *  └──────────────────────────────────────────────────┘
 *
 * Resize behavior:
 *  - Left vertical drag handle (left ↔ center) adjusts leftWidth
 *  - Right vertical drag handle (center ↔ right) adjusts rightWidth
 *  - Horizontal drag handle (main ↔ terminal) adjusts terminalHeight
 *  - All sizes clamped to safe min/max values
 *  - Window resize re-fits terminal (terminal panel itself handles xterm fit)
 *
 * Props:
 *  leftPanel    — ReactNode rendered in the left (files) slot
 *  centerPanel  — ReactNode rendered in the center (preview) slot
 *  rightPanel   — ReactNode rendered in the right (chat) slot
 *  bottomPanel  — ReactNode rendered in the bottom (terminal) slot
 */
export default function WorkspaceLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }) {
  // Panel size state (in pixels)
  const [leftWidth, setLeftWidth] = useState(220);           // px — project files
  const [rightWidth, setRightWidth] = useState(320);         // px — chat
  const [terminalHeight, setTerminalHeight] = useState(260); // px

  const containerRef = useRef(null);
  const isDraggingLeft = useRef(false);       // left ↔ center
  const isDraggingRight = useRef(false);      // center ↔ right
  const isDraggingHorizontal = useRef(false); // main ↔ terminal
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartLeftWidth = useRef(leftWidth);
  const dragStartRightWidth = useRef(rightWidth);
  const dragStartTermHeight = useRef(terminalHeight);

  // ── Left vertical drag (left ↔ center) ────────────────────────────────
  const onLeftDragStart = useCallback((e) => {
    isDraggingLeft.current = true;
    dragStartX.current = e.clientX;
    dragStartLeftWidth.current = leftWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }, [leftWidth]);

  // ── Right vertical drag (center ↔ right) ──────────────────────────────
  const onRightDragStart = useCallback((e) => {
    isDraggingRight.current = true;
    dragStartX.current = e.clientX;
    dragStartRightWidth.current = rightWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }, [rightWidth]);

  // ── Horizontal drag (main ↔ terminal) ─────────────────────────────────
  const onHorizontalDragStart = useCallback((e) => {
    isDraggingHorizontal.current = true;
    dragStartY.current = e.clientY;
    dragStartTermHeight.current = terminalHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }, [terminalHeight]);

  useEffect(() => {
    const onMouseMove = (e) => {
      const containerW = containerRef.current ? containerRef.current.offsetWidth : 1200;
      const containerH = containerRef.current ? containerRef.current.offsetHeight : 800;

      if (isDraggingLeft.current) {
        const delta = e.clientX - dragStartX.current;
        const newWidth = dragStartLeftWidth.current + delta;
        // Clamp: min 160px, max 35% of container
        setLeftWidth(Math.max(160, Math.min(newWidth, containerW * 0.35)));
      }

      if (isDraggingRight.current) {
        const delta = e.clientX - dragStartX.current;
        // Dragging right handle leftward makes right panel wider
        const newWidth = dragStartRightWidth.current - delta;
        // Clamp: min 220px, max 50% of container
        setRightWidth(Math.max(220, Math.min(newWidth, containerW * 0.5)));
      }

      if (isDraggingHorizontal.current) {
        const delta = e.clientY - dragStartY.current;
        const newHeight = dragStartTermHeight.current - delta; // drag up = bigger terminal
        // Clamp: min 140px, max 60% of container
        setTerminalHeight(Math.max(140, Math.min(newHeight, containerH * 0.6)));
      }
    };

    const onMouseUp = () => {
      if (isDraggingLeft.current || isDraggingRight.current || isDraggingHorizontal.current) {
        isDraggingLeft.current = false;
        isDraggingRight.current = false;
        isDraggingHorizontal.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Main content height = full remaining height minus terminal panel
  const mainHeight = `calc(100% - ${terminalHeight}px - 5px)`; // 5px for the drag handle

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--color-bg)",
        minHeight: 0,
      }}
    >
      {/* ── Top row: files | preview | chat ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: mainHeight,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Left panel (project files) */}
        <div
          id="panel-files"
          style={{
            width: leftWidth,
            minWidth: leftWidth,
            maxWidth: leftWidth,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: "1px solid var(--color-border)",
            background: "var(--color-surface)",
          }}
        >
          {leftPanel}
        </div>

        {/* Left vertical resize handle (files ↔ preview) */}
        <ResizeHandle
          direction="vertical"
          onMouseDown={onLeftDragStart}
          title="Drag to resize files panel"
        />

        {/* Center panel (preview) */}
        <div
          id="panel-preview"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
            background: "var(--color-bg)",
          }}
        >
          {centerPanel}
        </div>

        {/* Right vertical resize handle (preview ↔ chat) */}
        <ResizeHandle
          direction="vertical"
          onMouseDown={onRightDragStart}
          title="Drag to resize chat panel"
        />

        {/* Right panel (chat) */}
        <div
          id="panel-chat"
          style={{
            width: rightWidth,
            minWidth: rightWidth,
            maxWidth: rightWidth,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderLeft: "1px solid var(--color-border)",
            background: "var(--color-surface)",
          }}
        >
          {rightPanel}
        </div>
      </div>

      {/* Horizontal resize handle */}
      <ResizeHandle
        direction="horizontal"
        onMouseDown={onHorizontalDragStart}
        title="Drag to resize terminal panel"
      />

      {/* ── Bottom panel (terminal) ────────────────────────────────────── */}
      <div
        id="panel-terminal"
        style={{
          height: terminalHeight,
          minHeight: terminalHeight,
          maxHeight: terminalHeight,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        {bottomPanel}
      </div>
    </div>
  );
}

/**
 * ResizeHandle — a thin draggable divider between panels.
 * direction: "vertical" (between left and center) | "horizontal" (between main and bottom)
 */
function ResizeHandle({ direction, onMouseDown, title }) {
  const isVertical = direction === "vertical";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="separator"
      aria-label={title}
      title={title}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        ...(isVertical
          ? { width: 5, cursor: "col-resize", height: "100%" }
          : { height: 5, cursor: "row-resize", width: "100%" }),
        background: hovered ? "var(--color-accent)" : "var(--color-border)",
        transition: "background var(--transition-fast)",
        position: "relative",
        zIndex: 1,
      }}
    />
  );
}
