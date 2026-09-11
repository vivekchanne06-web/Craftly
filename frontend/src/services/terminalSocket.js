import { io } from "socket.io-client";
import { getAgentUrl } from "../config/env.js";

/**
 * Terminal Socket Service
 *
 * Manages the Socket.IO connection to the per-sandbox PTY agent.
 *
 * Backend Contract:
 *   URL: getAgentUrl(sandboxId) (derived from VITE_AGENT_BASE_URL)
 *   Client → Server:
 *     "terminal-input"  : string (raw terminal input characters)
 *     "terminal-resize" : { cols: number, rows: number }
 *   Server → Client:
 *     "terminal-output" : string (raw terminal output with ANSI codes)
 *     "terminal-exit"   : { exitCode: number, signal: string }
 *     "terminal-error"  : string (error message)
 */

/**
 * Creates and connects a Socket.IO client for a sandbox terminal.
 *
 * @param {string} sandboxId - The dynamic runtime sandboxId
 * @param {Object} handlers
 * @param {function(string): void} handlers.onOutput - Receives raw terminal output string
 * @param {function(Object): void} [handlers.onExit] - Receives { exitCode, signal }
 * @param {function(string): void} [handlers.onError] - Receives error string
 * @param {function(): void} [handlers.onConnect] - Socket connected
 * @param {function(string): void} [handlers.onDisconnect] - Socket disconnected
 * @param {function(Error): void} [handlers.onConnectError] - Socket connection error
 * @returns {{
 *   socket: import("socket.io-client").Socket,
 *   sendInput: function(string): void,
 *   sendResize: function(number, number): void,
 *   disconnect: function(): void
 * }}
 */
export function createTerminalSocket(sandboxId, handlers = {}) {
  if (!sandboxId || typeof sandboxId !== "string") {
    throw new Error("createTerminalSocket requires a valid sandboxId string.");
  }

  const agentUrl = getAgentUrl(sandboxId);

  const socket = io(agentUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  // ── Event Handlers ──
  socket.on("connect", () => {
    handlers.onConnect?.();
  });

  socket.on("disconnect", (reason) => {
    handlers.onDisconnect?.(reason);
  });

  socket.on("connect_error", (error) => {
    handlers.onConnectError?.(error);
  });

  socket.on("terminal-output", (data) => {
    if (typeof data === "string") {
      handlers.onOutput?.(data);
    }
  });

  socket.on("terminal-exit", (data) => {
    handlers.onExit?.(data || {});
  });

  socket.on("terminal-error", (errMessage) => {
    handlers.onError?.(typeof errMessage === "string" ? errMessage : "Terminal error occurred.");
  });

  /**
   * Send raw terminal keystrokes / input string to backend PTY.
   * @param {string} data
   */
  const sendInput = (data) => {
    if (socket.connected && typeof data === "string") {
      socket.emit("terminal-input", data);
    }
  };

  /**
   * Send new terminal dimensions to backend PTY.
   * @param {number} cols
   * @param {number} rows
   */
  const sendResize = (cols, rows) => {
    if (
      socket.connected &&
      Number.isInteger(cols) &&
      Number.isInteger(rows) &&
      cols > 0 &&
      rows > 0
    ) {
      socket.emit("terminal-resize", { cols, rows });
    }
  };

  /**
   * Disconnect and clean up all listeners.
   */
  const disconnect = () => {
    socket.removeAllListeners();
    socket.disconnect();
  };

  return {
    socket,
    sendInput,
    sendResize,
    disconnect,
  };
}
