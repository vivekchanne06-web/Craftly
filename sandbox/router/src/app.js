import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import http from "http";
import { createProxyServer } from 'httpxy';

const SANDBOX_ID = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const HOST_SUFFIXES = new Map([
  ["agent", 3000],
  ["preview", 80],
]);

export const app = express();
app.use(morgan("combined"));

app.get("/api/status/health", (req, res) => {
  res.status(200).json({ status: "Router is healthy!" });
});

app.get("/api/status/ready", (req, res) => {
  res.status(200).json({ status: "Router is ready!" });
});

function getRoute(hostHeader) {
  const host = hostHeader?.replace(/:\d+$/, "").toLowerCase();
  const parts = host?.split(".");

  if (!host || parts.length !== 3 || parts[2] !== "localhost") {
    return null;
  }

  const [sandboxId, type] = parts;
  if (!SANDBOX_ID.test(sandboxId) || !HOST_SUFFIXES.has(type)) {
    return null;
  }

  return { sandboxId, type, port: HOST_SUFFIXES.get(type) };
}

function createSandboxProxy() {
  return createProxyMiddleware({
    target: "http://127.0.0.1",
    changeOrigin: true,
    ws: true,
    router: (req) => {
      const route = getRoute(req.headers.host);
      if (!route) {
        throw new Error("Invalid sandbox host");
      }

      return `http://sandbox-service-${route.sandboxId}:${route.port}`;
    },
    on: {
      error: (error, req, res) => {
        console.error(`Sandbox proxy error for ${req.headers.host}: ${error.message}`);
        if (res && typeof res.writeHead === "function" && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            status: "error",
            message: "Sandbox service is unavailable",
          }));
        }
      },
    },
  });
}

const sandboxProxy = createSandboxProxy();

function proxyRequest(req, res, next) {
  const route = getRoute(req.headers.host);
  if (!route) {
    return res.status(404).json({
      message: "Unknown or invalid sandbox host",
      status: "error",
    });
  }

  return sandboxProxy(req, res, next);
}

const wsProxy = createProxyServer({ changeOrigin: true });

wsProxy.on('error', (err, req, socket) => {
    console.error('WS proxy error:', err.message);
    socket?.destroy();
});

app.use(proxyRequest);

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  const route = getRoute(req.headers.host);
  if (!route) {
    socket.destroy();
    return;
  }

  console.log(
    `WS upgrade request: ${req.headers.host}, sandboxId: ${route.sandboxId}, type: ${route.type}`,
  );
  sandboxProxy.upgrade(req, socket, head);
});

export default server;
