/**
 * Agent API — per-sandbox file operations.
 *
 * All URLs are derived from getAgentUrl(sandboxId) via VITE_AGENT_URL_TEMPLATE.
 * No absolute URLs or localhost references in this file.
 *
 * Backend contract (per-sandbox agent):
 *   GET    /list-files
 *   GET    /read-files?files=<URL-encoded path>
 *   PATCH  /update-files   { updates: [{ file, content }] }
 *   POST   /create-files   { files: [{ file, content }] }
 *   DELETE /delete-files   { files: [path] }
 */

import { getAgentUrl } from "../config/env.js";

/**
 * Lists all files in the sandbox workspace.
 *
 * @param {string} sandboxId
 * @param {AbortSignal} [signal]
 * @returns {Promise<string[]>} Array of file paths
 */
export async function listFiles(sandboxId, signal) {
  const url = `${getAgentUrl(sandboxId)}/list-files`;
  const response = await agentFetch(url, { method: "GET", signal }, sandboxId);
  const data = await parseJson(response, "/list-files");
  return Array.isArray(data.files) ? data.files.map((f) => f.replace(/\\/g, "/")) : [];
}

/**
 * Reads the content of a file.
 *
 * @param {string} sandboxId
 * @param {string} filePath
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} File content
 */
export async function readFile(sandboxId, filePath, signal) {
  if (!filePath) throw new Error("filePath is required");
  const params = new URLSearchParams({ files: filePath });
  const url = `${getAgentUrl(sandboxId)}/read-files?${params}`;
  const response = await agentFetch(url, { method: "GET", signal }, sandboxId);
  const data = await parseJson(response, "/read-files");

  if (!Array.isArray(data.files) || data.files.length === 0) {
    throw new Error(`No content returned for "${filePath}".`);
  }

  const fileEntry = data.files[0];
  const keys = Object.keys(fileEntry);
  if (keys.length === 0) throw new Error(`Empty payload for "${filePath}".`);

  const content = fileEntry[keys[0]];
  if (typeof content === "string" && content.startsWith("Error reading file:")) {
    throw new Error(content);
  }
  return content ?? "";
}

/**
 * Updates (saves) a file in the sandbox.
 *
 * @param {string} sandboxId
 * @param {string} file — File path
 * @param {string} content — New content
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
export async function updateFile(sandboxId, file, content, signal) {
  const url = `${getAgentUrl(sandboxId)}/update-files`;
  await agentFetch(
    url,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: [{ file, content }] }),
      signal,
    },
    sandboxId
  );
}

/**
 * Creates a new file in the sandbox.
 *
 * @param {string} sandboxId
 * @param {string} file — File path
 * @param {string} content — Initial content
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
export async function createFile(sandboxId, file, content = "", signal) {
  const url = `${getAgentUrl(sandboxId)}/create-files`;
  await agentFetch(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: [{ file, content }] }),
      signal,
    },
    sandboxId
  );
}

/**
 * Deletes one or more files from the sandbox.
 *
 * @param {string} sandboxId
 * @param {string[]} files — Array of file paths to delete
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
export async function deleteFiles(sandboxId, files, signal) {
  const url = `${getAgentUrl(sandboxId)}/delete-files`;
  await agentFetch(
    url,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
      signal,
    },
    sandboxId
  );
}

/* ── Helpers ── */

async function agentFetch(url, options, sandboxId) {
  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      ...options,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error(
      `Cannot reach sandbox agent (${sandboxId}): ${err.message}`,
      { cause: err }
    );
  }

  if (!response.ok) {
    throw new Error(
      `Agent responded with HTTP ${response.status} for ${new URL(url).pathname}.`
    );
  }

  return response;
}

async function parseJson(response, endpoint) {
  try {
    return await response.json();
  } catch {
    throw new Error(`Agent returned non-JSON response for ${endpoint}.`);
  }
}
