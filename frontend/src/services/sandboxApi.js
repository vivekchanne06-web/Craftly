import { API_BASE_URL, getAgentUrl } from "../config/env.js";

/**
 * Sandbox API service
 *
 * Handles communication with the /api/sandbox/* backend endpoints
 * and per-sandbox agent endpoints (/read-files, /list-files).
 * All URLs are derived from the centralized env config — never hardcoded here.
 */

/**
 * Creates a new sandbox environment.
 *
 * Calls POST /api/sandbox/start on the backend.
 * The backend provisions a Kubernetes pod + service and returns a unique
 * sandboxId and previewUrl for this session.
 *
 * @returns {Promise<{ sandboxId: string, previewUrl: string }>}
 * @throws {Error} with a descriptive message if the request fails
 */
export async function createSandbox() {
  const url = `${API_BASE_URL}/api/sandbox/start`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  } catch (networkError) {
    throw new Error(
      `Unable to reach the Craftly backend at ${API_BASE_URL}. ` +
        `Make sure the server is running and accessible. (${networkError.message})`,
      { cause: networkError }
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.message || body.error || "";
    } catch {
      // Response body wasn't JSON — ignore
    }
    throw new Error(
      `Sandbox creation failed (HTTP ${response.status}). ` +
        (detail ? `Server said: ${detail}` : "Please check the backend logs.")
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Sandbox API returned an unexpected (non-JSON) response.");
  }

  const { sandboxId, previewUrl } = data;

  if (!sandboxId || typeof sandboxId !== "string") {
    throw new Error(
      "Sandbox API response is missing a valid sandboxId. " +
        "This is likely a backend configuration issue."
    );
  }
  if (!previewUrl || typeof previewUrl !== "string") {
    throw new Error(
      "Sandbox API response is missing a valid previewUrl. " +
        "This is likely a backend configuration issue."
    );
  }

  return { sandboxId, previewUrl };
}

/**
 * Reads the content of a file from the active sandbox Agent.
 *
 * Calls GET /read-files?files=<filePath> on the agent at getAgentUrl(sandboxId).
 * Safe URLSearchParams encoding ensures special characters and slashes are properly handled.
 *
 * @param {string} sandboxId - Active sandbox UUID
 * @param {string} filePath - Path relative to /workspace (e.g. "src/App.jsx")
 * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<string>} Content of the requested file
 */
export async function readSandboxFile(sandboxId, filePath, signal) {
  if (!sandboxId) throw new Error("sandboxId is required to read file");
  if (!filePath) throw new Error("filePath is required");

  const agentUrl = getAgentUrl(sandboxId);
  const params = new URLSearchParams({ files: filePath });
  const url = `${agentUrl}/read-files?${params.toString()}`;

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    });
  } catch (networkError) {
    if (networkError.name === "AbortError") throw networkError;
    throw new Error(
      `Failed to connect to Sandbox Agent for file "${filePath}". (${networkError.message})`,
      { cause: networkError }
    );
  }

  if (!response.ok) {
    throw new Error(`Agent returned HTTP ${response.status} when reading "${filePath}".`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Agent returned non-JSON response when reading "${filePath}".`);
  }

  // Response structure: { message: "File contents", files: [ { [filePathKey]: content } ] }
  if (!Array.isArray(data.files) || data.files.length === 0) {
    throw new Error(`No file content returned by agent for "${filePath}".`);
  }

  const fileEntry = data.files[0];
  const keys = Object.keys(fileEntry);
  if (keys.length === 0) {
    throw new Error(`Empty file payload returned for "${filePath}".`);
  }

  const content = fileEntry[keys[0]];

  if (typeof content === "string" && content.startsWith("Error reading file:")) {
    throw new Error(content);
  }

  return content ?? "";
}

