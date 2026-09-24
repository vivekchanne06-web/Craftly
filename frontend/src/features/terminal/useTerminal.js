/**
 * useTerminal — xterm.js + FitAddon + ResizeObserver + Socket.IO.
 *
 * Validates VITE_AGENT_URL_TEMPLATE before connecting.
 * Returns configError if template is missing/malformed.
 * Connects to the sandbox agent using lib/api/terminal.js (createTerminalSocket).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { createTerminalSocket } from "../../lib/api/terminal.js";
import { validateAgentConfig } from "../../lib/config/env.js";

// Dynamically import xterm CSS (avoids bundling in non-terminal contexts)
import "@xterm/xterm/css/xterm.css";

/**
 * @param {string|null} sandboxId
 * @returns {{
 *   containerRef: React.RefObject,
 *   status: "idle"|"connecting"|"connected"|"disconnected"|"error"|"config-error",
 *   errorMsg: string|null,
 *   connect: () => void,
 *   disconnect: () => void,
 *   clear: () => void,
 * }}
 */
export function useTerminal(sandboxId) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);

  const cleanup = useCallback(() => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    termRef.current?.dispose();
    termRef.current = null;
    fitAddonRef.current = null;
  }, []);

  const connect = useCallback(() => {
    if (!sandboxId) { setStatus("idle"); return; }
    if (!containerRef.current) return;

    // Config check — surface at workspace level, not app level
    const { valid, error } = validateAgentConfig();
    if (!valid) {
      setStatus("config-error");
      setErrorMsg(error);
      return;
    }

    cleanup();
    setStatus("connecting");
    setErrorMsg(null);

    // Initialize xterm
    const term = new Terminal({
      fontSize: 13,
      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
      theme: {
        background: "#0b0f14",
        foreground: "#e2e8f0",
        cursor: "#6366f1",
        cursorAccent: "#0b0f14",
        black: "#1e2432",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#f59e0b",
        blue: "#6366f1",
        magenta: "#8b5cf6",
        cyan: "#06b6d4",
        white: "#e2e8f0",
        brightBlack: "#475569",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#fbbf24",
        brightBlue: "#818cf8",
        brightMagenta: "#a78bfa",
        brightCyan: "#22d3ee",
        brightWhite: "#f8fafc",
      },
      cursorBlink: true,
      convertEol: true,
      scrollback: 2000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);

    try { fitAddon.fit(); } catch { /* not yet measurable */ }

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Socket connection
    let sock;
    try {
      sock = createTerminalSocket(sandboxId, {
        onConnect: () => {
          setStatus("connected");
          try { fitAddon.fit(); } catch { /* */ }
          const { cols, rows } = term;
          sock.sendResize(cols, rows);
        },
        onDisconnect: (reason) => {
          setStatus("disconnected");
          if (reason !== "io client disconnect") {
            term.write("\r\n\x1b[33m[Disconnected: reconnecting…]\x1b[0m\r\n");
          }
        },
        onConnectError: (err) => {
          setStatus("error");
          setErrorMsg(err.message || "Connection error.");
          term.write(`\r\n\x1b[31m[Connection error: ${err.message}]\x1b[0m\r\n`);
        },
        onOutput: (data) => term.write(data),
        onExit: ({ exitCode }) => {
          term.write(`\r\n\x1b[90m[Process exited with code ${exitCode ?? "?"}]\x1b[0m\r\n`);
        },
        onError: (msg) => {
          term.write(`\r\n\x1b[31m[Terminal error: ${msg}]\x1b[0m\r\n`);
        },
      });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
      return;
    }

    socketRef.current = sock;

    // Forward user keystrokes to socket
    term.onData((data) => sock.sendInput(data));

    // Resize observer
    const ro = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch { return; }
      const { cols, rows } = term;
      if (sock.socket?.connected) sock.sendResize(cols, rows);
    });
    if (containerRef.current) ro.observe(containerRef.current);
    resizeObserverRef.current = ro;
  }, [sandboxId, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus("disconnected");
  }, [cleanup]);

  const clear = useCallback(() => {
    termRef.current?.clear();
  }, []);

  // Auto-connect when sandboxId is set
  useEffect(() => {
    if (!sandboxId) return;
    const timer = setTimeout(() => {
      connect();
    }, 0);
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [sandboxId, connect, cleanup]);

  return { containerRef, status, errorMsg, connect, disconnect, clear };
}
