import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";

export const app = express();
app.use(morgan("combined"));

app.get("/api/status/health", (req, res) => {
  res.status(200).json({ status: "Router is healthy!" });
});

app.get("/api/status/ready", (req, res) => {
  res.status(200).json({ status: "Router is ready!" });
});

const proxies= {}
const agentProxies = {}

function getProxy(sandboxID) {

    const target = `http://sandbox-service-${sandboxID}`;

    if (!proxies[sandboxID]) {
        proxies[sandboxID] = createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
        });
    }
    return proxies[sandboxID];
}

function getAgentProxy(sandboxID) {

    const target = `http://sandbox-service-${sandboxID}:3000`;

    if (!agentProxies[sandboxID]) {
        agentProxies[sandboxID] = createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
        });
    }
    return agentProxies[sandboxID];
}

export function handleWebSocketUpgrade(req, socket, head) {
  const host = req.headers.host;
  const parts = host?.split(".");
  const sandboxID = parts?.[0];
  const type = parts?.[1];

  console.log("🔥 ROUTER WEBSOCKET HANDLER");
  console.log("host:", host);
  console.log("sandboxID:", sandboxID);
  console.log("type:", type);
  console.log("url:", req.url);

  if (type === "agent") {
    console.log("➡️ Proxying WebSocket to agent:", sandboxID);
    return getAgentProxy(sandboxID).upgrade(req, socket, head);
  }

  if (type === "preview") {
    console.log("➡️ Proxying WebSocket to preview:", sandboxID);
    return getProxy(sandboxID).upgrade(req, socket, head);
  }

  console.log("❌ Unknown WebSocket host:", host);
  socket.destroy();
}

app.use((req, res, next) => {
  const host = req.headers.host;
  const parts = host?.split(".");

  const sandboxID = parts?.[0];
  const type = parts?.[1];

  if (type === "agent") {
    return getAgentProxy(sandboxID)(req, res, next);
  }

  if (type === "preview") {
    return getProxy(sandboxID)(req, res, next);
  }

  return res.status(404).json({
    message: "Unknown host",
    status: "error",
  });
});

export default app;

