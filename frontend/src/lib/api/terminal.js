/**
 * Terminal Socket — Socket.IO connection to per-sandbox PTY agent.
 *
 * URL comes only from getAgentUrl(sandboxId) via VITE_AGENT_URL_TEMPLATE.
 * No hardcoded hostnames or ports.
 *
 * Events:
 *   Client → Server: "terminal-input" (string), "terminal-resize" ({ cols, rows })
 *   Server → Client: "terminal-output" (string), "terminal-exit" ({ exitCode, signal }),
 *                    "terminal-error" (string)
 */

import { io } from "socket.io-client";
import { getAgentUrl } from "../config/env.js";

/**
 * Creates and connects a Socket.IO client for a sandbox terminal.
 *
 * @param {string} sandboxId
 * @param {Object} handlers
 * @param {function(): void} [handlers.onConnect]
 * @param {function(string): void} [handlers.onDisconnect]
 * @param {function(Error): void} [handlers.onConnectError]
 * @param {function(string): void} [handlers.onOutput]
 * @param {function({ exitCode, signal }): void} [handlers.onExit]
 * @param {function(string): void} [handlers.onError]
 * @returns {{ socket, sendInput, sendResize, disconnect }}
 */
export function createTerminalSocket(sandboxId, handlers = {}) {
  if (!sandboxId) throw new Error("createTerminalSocket: sandboxId is required.");

  // getAgentUrl throws if VITE_AGENT_URL_TEMPLATE is invalid —
  // the caller (useTerminal) catches this and surfaces it as a config error.
  const agentUrl = getAgentUrl(sandboxId);

  // In dev proxy mode, getAgentUrl returns a relative path like /sandbox-agent/<id>.
  // Socket.IO's io() cannot accept a bare relative path as the server URL.
  // We split it into: server = window.location.origin, path = /sandbox-agent/<id>/socket.io
  // The Vite dev proxy intercepts the WebSocket upgrade, extracts the sandboxId from the
  // path, and forwards it to 127.0.0.1:8080 with the correct Host header.
  const isRelative = agentUrl.startsWith("/");
  const serverUrl = isRelative ? window.location.origin : agentUrl;
  const socketPath = isRelative ? `${agentUrl}/socket.io` : "/socket.io";

  const socket = io(serverUrl, {
    path: socketPath,
    // In dev proxy mode, start with polling so the HTTP handshake goes through
    // the bypass() hook (which correctly stashes the sandboxId for proxyReq).
    // Socket.IO will automatically upgrade to WebSocket after the handshake.
    // The X-Sandbox-Id header tells the proxyReqWs handler which sandbox to
    // route to during the WS upgrade (Vite doesn't run bypass() for upgrades).
    transports: isRelative ? ["polling", "websocket"] : ["websocket", "polling"],
    extraHeaders: isRelative ? { "x-sandbox-id": sandboxId } : {},
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  socket.on("connect", () => handlers.onConnect?.());
  socket.on("disconnect", (reason) => handlers.onDisconnect?.(reason));
  socket.on("connect_error", (err) => handlers.onConnectError?.(err));
  socket.on("terminal-output", (data) => {
    if (typeof data === "string") handlers.onOutput?.(data);
  });
  socket.on("terminal-exit", (data) => handlers.onExit?.(data || {}));
  socket.on("terminal-error", (msg) =>
    handlers.onError?.(typeof msg === "string" ? msg : "Terminal error.")
  );

  const sendInput = (data) => {
    if (socket.connected && typeof data === "string") socket.emit("terminal-input", data);
  };

  const sendResize = (cols, rows) => {
    if (
      socket.connected &&
      Number.isInteger(cols) && Number.isInteger(rows) &&
      cols > 0 && rows > 0
    ) {
      socket.emit("terminal-resize", { cols, rows });
    }
  };

  const disconnect = () => {
    socket.removeAllListeners();
    socket.disconnect();
  };

  return { socket, sendInput, sendResize, disconnect };
}
