/**
 * Projects API — first-party backend endpoints.
 *
 * All paths are relative (/api/…). No absolute URLs.
 * All requests include credentials: "include" for cookie-based auth.
 *
 * Backend contract:
 *   GET  /api/sandbox/project          → { projects: [...] }  (401 = unauthenticated)
 *   POST /api/sandbox/project { title } → { project }
 *   POST /api/sandbox/start { projectId } → { sandboxId, previewUrl }
 */

import { getPreviewUrl } from "../config/env.js";

const PROJECTS_URL = "/api/sandbox/project";
const SANDBOX_START_URL = "/api/sandbox/start";

/**
 * Fetches the list of projects for the authenticated user.
 * A 401 response indicates the user is unauthenticated.
 *
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ authenticated: boolean, projects: Array }>}
 */
export async function getProjects(signal) {
  let response;
  try {
    response = await fetch(PROJECTS_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error(`Network error fetching projects: ${err.message}`, { cause: err });
  }

  if (response.status === 401) {
    return { authenticated: false, projects: [] };
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.message || body.error || "";
    } catch { /* non-JSON body */ }
    throw new Error(
      `Failed to load projects (HTTP ${response.status}).` +
        (detail ? ` Server: ${detail}` : "")
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Projects API returned a non-JSON response.");
  }

  return {
    authenticated: true,
    projects: Array.isArray(data.projects) ? data.projects : [],
  };
}

/**
 * Creates a new project.
 *
 * @param {string} title
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ project: object }>}
 */
export async function createProject(title, signal) {
  if (!title || !title.trim()) throw new Error("Project title is required.");

  let response;
  try {
    response = await fetch(PROJECTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ title: title.trim() }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error(`Network error creating project: ${err.message}`, { cause: err });
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.message || body.error || "";
    } catch { /* non-JSON body */ }
    throw new Error(
      `Failed to create project (HTTP ${response.status}).` +
        (detail ? ` Server: ${detail}` : "")
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Create project API returned a non-JSON response.");
  }

  if (!data.project) {
    throw new Error("Create project response missing 'project' field.");
  }

  return { project: data.project };
}

/**
 * Starts a sandbox for a project.
 * Requires an authenticated session and a valid projectId.
 *
 * @param {string} projectId
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ sandboxId: string, previewUrl: string }>}
 */
export async function startSandbox(projectId, signal) {
  if (!projectId) throw new Error("projectId is required to start a sandbox.");

  let response;
  try {
    response = await fetch(SANDBOX_START_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ projectId }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error(`Network error starting sandbox: ${err.message}`, { cause: err });
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.message || body.error || "";
    } catch { /* non-JSON body */ }
    throw new Error(
      `Sandbox start failed (HTTP ${response.status}).` +
        (detail ? ` Server: ${detail}` : " Check backend logs.")
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Sandbox start API returned a non-JSON response.");
  }

  const { sandboxId, previewUrl } = data;

  if (!sandboxId || typeof sandboxId !== "string") {
    throw new Error("Sandbox start response missing valid 'sandboxId'.");
  }
  if (!previewUrl || typeof previewUrl !== "string") {
    throw new Error("Sandbox start response missing valid 'previewUrl'.");
  }

  // In production and local development, the backend-returned previewUrl
  // (http://<sandboxId>.preview.localhost) is used directly.
  return { sandboxId, previewUrl: getPreviewUrl(previewUrl) };
}
