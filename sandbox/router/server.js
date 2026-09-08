import http from "http";
import app, { handleWebSocketUpgrade } from "./src/app.js";

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  console.log("🔥 WEBSOCKET UPGRADE RECEIVED");
  console.log("Host:", req.headers.host);
  console.log("URL:", req.url);
  console.log("Upgrade:", req.headers.upgrade);

  handleWebSocketUpgrade(req, socket, head);
});

server.listen(3000, () => {
  console.log("Sandbox router server is running on port 3000");
});