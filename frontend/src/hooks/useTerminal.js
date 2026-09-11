import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { createTerminalSocket } from "../services/terminalSocket.js";

/**
 * Custom theme matching Craftly design tokens.
 */
const CRAFTLY_TERMINAL_THEME = {
  background: "#0b0f14",
  foreground: "#e2e8f0",
  cursor: "#6366f1",
  cursorAccent: "#0b0f14",
  selectionBackground: "rgba(99, 102, 241, 0.35)",
  selectionForeground: "#ffffff",
  black: "#11161d",
  red: "#ef4444",
  green: "#22c55e",
  yellow: "#f59e0b",
  blue: "#6366f1",
  magenta: "#a855f7",
  cyan: "#06b6d4",
  white: "#e2e8f0",
  brightBlack: "#475569",
  brightRed: "#f87171",
  brightGreen: "#4ade80",
  brightYellow: "#fbbf24",
  brightBlue: "#818cf8",
  brightMagenta: "#c084fc",
  brightCyan: "#22d3ee",
  brightWhite: "#ffffff",
};

/**
 * useTerminal — Hook managing xterm instance, FitAddon, ResizeObserver,
 * and Socket.IO connection to the per-sandbox PTY.
 *
 * @param {string} sandboxId - The dynamic runtime sandboxId
 * @param {import("react").RefObject<HTMLDivElement>} containerRef - The container element to mount xterm
 */
export function useTerminal(sandboxId, containerRef) {
  const [status, setStatus] = useState(() => (sandboxId ? "connecting" : "disconnected"));
  const [errorMessage, setErrorMessage] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketServiceRef = useRef(null);
  const lastDimensionsRef = useRef({ cols: 0, rows: 0 });

  /**
   * Manually trigger a reconnect.
   */
  const reconnect = useCallback(() => {
    setStatus("connecting");
    setErrorMessage(null);
    setReconnectCount((c) => c + 1);
  }, []);

  /**
   * Clear the terminal output buffer.
   */
  const clearTerminal = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.clear();
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !sandboxId) {
      return;
    }

    // 1. Initialize xterm instance
    const term = new Terminal({
      theme: CRAFTLY_TERMINAL_THEME,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.35,
      cursorBlink: true,
      cursorStyle: "block",
      convertEol: true,
      scrollback: 5000,
      allowTransparency: true,
      tabStopWidth: 2,
    });

    // 2. Attach FitAddon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // 3. Mount to container
    containerRef.current.innerHTML = "";
    term.open(containerRef.current);

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // Initial fit
    try {
      fitAddon.fit();
    } catch {
      // Container may not have dimensions yet
    }

    // 4. Create Socket.IO connection
    let socketService;
    try {
      socketService = createTerminalSocket(sandboxId, {
        onConnect: () => {
          setStatus("connected");
          setErrorMessage(null);

          // Initial resize dispatch after connection
          try {
            fitAddon.fit();
            const cols = term.cols;
            const rows = term.rows;
            if (cols > 0 && rows > 0) {
              lastDimensionsRef.current = { cols, rows };
              socketService.sendResize(cols, rows);
            }
          } catch {
            // fit may fail if unmounted
          }
        },

        onDisconnect: (reason) => {
          setStatus("disconnected");
          if (reason !== "io client disconnect") {
            term.write(`\r\n\x1b[33m[Connection closed: ${reason}]\x1b[0m\r\n`);
          }
        },

        onConnectError: (err) => {
          setStatus("error");
          setErrorMessage(err.message || "Failed to connect to terminal agent.");
        },

        onOutput: (data) => {
          term.write(data);
        },

        onExit: ({ exitCode, signal }) => {
          setStatus("disconnected");
          term.write(
            `\r\n\x1b[90m[Process exited (code: ${exitCode ?? "N/A"}, signal: ${signal ?? "N/A"})]\x1b[0m\r\n`
          );
        },

        onError: (errMsg) => {
          setStatus("error");
          setErrorMessage(errMsg);
          term.write(`\r\n\x1b[31m[Terminal error: ${errMsg}]\x1b[0m\r\n`);
        },
      });

      socketServiceRef.current = socketService;

      // 5. Pipe keyboard input from xterm to socket
      const onDataDisposable = term.onData((input) => {
        socketService.sendInput(input);
      });

      // 6. Setup ResizeObserver for responsive resizing
      let resizeTimeout = null;
      const resizeObserver = new ResizeObserver(() => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (!containerRef.current || !term || !fitAddon) return;
          try {
            fitAddon.fit();
            const cols = term.cols;
            const rows = term.rows;

            if (
              cols > 0 &&
              rows > 0 &&
              (cols !== lastDimensionsRef.current.cols || rows !== lastDimensionsRef.current.rows)
            ) {
              lastDimensionsRef.current = { cols, rows };
              socketService.sendResize(cols, rows);
            }
          } catch {
            // Resize failed gracefully
          }
        }, 60);
      });

      resizeObserver.observe(containerRef.current);

      // ── Cleanup function (React 19 / StrictMode safe) ──
      return () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeObserver.disconnect();
        onDataDisposable.dispose();
        socketService.disconnect();
        socketServiceRef.current = null;
        term.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
      };
    } catch {
      return () => {
        term.dispose();
      };
    }
  }, [sandboxId, containerRef, reconnectCount]);

  return {
    status,
    errorMessage,
    reconnect,
    clearTerminal,
  };
}
