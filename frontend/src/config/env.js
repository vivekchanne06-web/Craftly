/**
 * Centralized environment configuration for Craftly frontend.
 *
 * ALL network URLs in the application must be derived from this module.
 * Never write raw hostnames or ports directly inside components or services.
 */

/**
 * Base URL for all /api/* HTTP requests (sandbox creation, AI invocation).
 * Configured via VITE_API_BASE_URL environment variable.
 * @example http://localhost:8080  (local dev with kubectl port-forward)
 * @example https://api.craftly.dev  (production)
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Base port/host used to derive agent Socket.IO URLs.
 * Each sandbox agent is served at: <sandboxId>.agent.localhost
 *
 * In local dev: the Nginx ingress is port-forwarded to localhost:8080,
 * so we need the URL to be http://<sandboxId>.agent.localhost:8080.
 * The browser must resolve *.agent.localhost → 127.0.0.1 (via hosts file or dnsmasq).
 *
 * Configured via VITE_AGENT_BASE_URL environment variable.
 * @example http://localhost:8080  (local dev)
 * @example https://agent.craftly.dev  (production — actual subdomain routing)
 */
const AGENT_BASE_URL =
  import.meta.env.VITE_AGENT_BASE_URL || "http://localhost:8080";

/**
 * Derives the Socket.IO connection URL for a given sandbox's agent.
 *
 * The agent ingress routes *.agent.localhost to the per-sandbox PTY agent.
 * We extract the port from VITE_AGENT_BASE_URL to build the correct URL
 * so the browser WebSocket upgrade goes to the right host:port.
 *
 * @param {string} sandboxId - The dynamic sandboxId returned by /api/sandbox/start
 * @returns {string} Full URL for Socket.IO to connect to this sandbox's agent
 */
export function getAgentUrl(sandboxId) {
  if (!sandboxId) {
    throw new Error("getAgentUrl requires a valid sandboxId");
  }

  try {
    const base = new URL(AGENT_BASE_URL);
    // Build: http://<sandboxId>.agent.localhost:<port>
    // (port is omitted if it's the default for the protocol)
    const port = base.port ? `:${base.port}` : "";
    return `${base.protocol}//${sandboxId}.agent.localhost${port}`;
  } catch {
    // Fallback: if AGENT_BASE_URL is malformed, use the sandboxId hostname directly
    console.warn(
      `[config] VITE_AGENT_BASE_URL "${AGENT_BASE_URL}" could not be parsed. Falling back to plain hostname.`
    );
    return `http://${sandboxId}.agent.localhost`;
  }
}

/**
 * Returns the previewUrl exactly as returned by the backend.
 * We never construct this ourselves — it comes from /api/sandbox/start.
 * This function exists purely for clarity and centralization.
 *
 * @param {string} previewUrl - The previewUrl string returned by the sandbox API
 * @returns {string} The same previewUrl, unchanged
 */
export function getPreviewUrl(previewUrl) {
  return previewUrl;
}

export default {
  API_BASE_URL,
  getAgentUrl,
  getPreviewUrl,
};
