/**
 * Craftly — Centralized environment and URL configuration.
 *
 * Rules enforced here:
 *  - No hardcoded hostnames, ports, or localhost fallbacks.
 *  - First-party API calls use relative paths (/api/…) — never constructed here.
 *  - Agent URL comes exclusively from VITE_AGENT_URL_TEMPLATE.
 *  - Preview URL: in production the backend-returned URL is used as-is;
 *    in development (when VITE_DEV_PROXY_TARGET is set) the preview is routed
 *    through the Vite dev proxy at /sandbox-preview/<sandboxId>/ to work around
 *    Windows not resolving *.localhost wildcard subdomains.
 *
 * VITE_AGENT_URL_TEMPLATE is only required for workspace/agent features.
 * Dashboard and authentication remain usable when it is absent.
 */

const AGENT_URL_TEMPLATE = import.meta.env.VITE_AGENT_URL_TEMPLATE ?? "";
const DEV_PROXY_TARGET = import.meta.env.VITE_DEV_PROXY_TARGET ?? "";

// True when the Vite dev proxy is active (local development).
// In this mode agent and preview requests are routed through the Vite server
// using path-based prefixes (/sandbox-agent/<id>/... and /sandbox-preview/<id>/...)
// instead of the hostname-based URLs that the production ingress uses.
const IS_DEV_PROXY = Boolean(DEV_PROXY_TARGET);

/**
 * Validates the agent URL template.
 * Returns { valid: true } or { valid: false, error: string }.
 *
 * Called lazily — only when the builder workspace tries to use agent features.
 * Do NOT call this on app startup or from dashboard/auth code.
 *
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateAgentConfig() {
  if (!AGENT_URL_TEMPLATE) {
    return {
      valid: false,
      error:
        "VITE_AGENT_URL_TEMPLATE is not set. " +
        "Add an agent URL template containing the {sandboxId} placeholder to your environment file.",
    };
  }

  if (!AGENT_URL_TEMPLATE.includes("{sandboxId}")) {
    return {
      valid: false,
      error:
        `VITE_AGENT_URL_TEMPLATE ("${AGENT_URL_TEMPLATE}") is missing the required ` +
        "{sandboxId} placeholder.",
    };
  }

  return { valid: true, error: null };
}

/**
 * Derives the agent base URL for a given sandbox.
 *
 * In development (VITE_DEV_PROXY_TARGET is set):
 *   Returns a relative path  /sandbox-agent/<sandboxId>
 *   The Vite dev server proxies this to VITE_DEV_PROXY_TARGET (127.0.0.1:8080)
 *   and injects the Host header  <sandboxId>.agent.localhost:8080  that the
 *   router needs — working around Windows not resolving *.localhost subdomains.
 *
 * In production (no dev proxy):
 *   Returns the full URL from VITE_AGENT_URL_TEMPLATE with {sandboxId} replaced.
 *   The sandboxId is used verbatim as a DNS hostname label; no encoding is applied.
 *
 * @param {string} sandboxId — The dynamic runtime sandboxId from the backend API
 * @returns {string} Agent base URL (no trailing slash)
 * @throws {Error} If the template is missing or malformed
 */
export function getAgentUrl(sandboxId) {
  if (!sandboxId) throw new Error("getAgentUrl: sandboxId is required");

  const { valid, error } = validateAgentConfig();
  if (!valid) throw new Error(error);

  if (IS_DEV_PROXY) {
    // Relative path — resolved by the Vite dev proxy with correct Host header.
    // sandboxId is a UUIDv7 containing only [a-z0-9-] so no encoding is needed.
    return `/sandbox-agent/${sandboxId}`;
  }

  // Production: use the hostname-based URL from the template.
  // Do NOT encode the sandboxId — it is a DNS hostname label, not a path segment.
  return AGENT_URL_TEMPLATE.replace("{sandboxId}", sandboxId);
}

/**
 * Returns the preview URL for a given sandbox.
 *
 * The preview URL is returned verbatim from the backend
 * (http://<sandboxId>.preview.localhost). Browsers natively resolve
 * *.localhost to 127.0.0.1 (RFC 6761), allowing the iframe to run in its
 * own isolated origin so root-relative asset paths (/src/main.jsx, /@vite/client)
 * correctly resolve to the sandbox container instead of Craftly's frontend.
 *
 * @param {string} previewUrl — From POST /api/sandbox/start response
 * @returns {string}
 */
export function getPreviewUrl(previewUrl) {
  return previewUrl;
}

export default { validateAgentConfig, getAgentUrl, getPreviewUrl };
