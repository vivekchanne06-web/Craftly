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



app.use((req, res, next) => {
  const host = req.headers.host;
  const sandboxID = host?.split(".")[0];



  return getProxy(sandboxID)(req, res, next);
});

export default app;

