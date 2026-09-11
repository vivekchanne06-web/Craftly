import { useCallback, useRef, useState } from "react";
import { createSandbox } from "../services/sandboxApi.js";

/**
 * useSandbox — manages the lifecycle of a Craftly sandbox.
 *
 * State machine:
 *   idle ──startSandbox()──► creating ──success──► ready
 *                                      └─failure──► error ──startSandbox()──► creating
 *
 * The hook provides:
 *   - sandbox   : { sandboxId, previewUrl, status }
 *   - startSandbox() : triggers sandbox creation (guarded against in-flight duplicates)
 *   - resetSandbox() : returns to idle so a NEW sandbox can be intentionally created
 *   - isCreating : boolean shorthand
 *   - error      : string | null — last error message
 *
 * Duplicate-creation protection:
 *   A per-request ref (`inflightRef`) is set to true when a fetch starts and
 *   cleared when it settles (success OR failure). This prevents:
 *     - accidental double-clicks
 *     - React StrictMode's double-invocation of effects
 *     - re-render–triggered repeat calls
 *   It does NOT block intentional future creation after success or error —
 *   the user can call startSandbox() again once the current request settles.
 *
 * @returns {{
 *   sandbox: { sandboxId: string|null, previewUrl: string|null, status: string },
 *   startSandbox: () => Promise<void>,
 *   resetSandbox: () => void,
 *   isCreating: boolean,
 *   error: string|null
 * }}
 */
export function useSandbox() {
  const [sandbox, setSandbox] = useState({
    sandboxId: null,
    previewUrl: null,
    status: "idle", // "idle" | "creating" | "ready" | "error"
  });

  const [error, setError] = useState(null);

  /**
   * In-flight guard ref.
   * True only while a fetch is pending. Resets when the request settles.
   * Prevents duplicate concurrent requests from double-clicks or StrictMode.
   * Does NOT permanently block future sandbox creation.
   */
  const inflightRef = useRef(false);

  /**
   * Start sandbox creation.
   *
   * Guards:
   * 1. inflightRef.current — a fetch is already pending (double-click / StrictMode)
   * 2. status === "creating" — state is already in creating (safety net)
   *
   * Does NOT block if status === "ready" or "error" — allowing intentional
   * creation of a new sandbox (e.g. after the user resets or retries).
   */
  const startSandbox = useCallback(async () => {
    // Guard: do not fire while a request is already in-flight
    if (inflightRef.current) return;

    inflightRef.current = true;
    setError(null);
    setSandbox((prev) => ({ ...prev, status: "creating" }));

    try {
      const { sandboxId, previewUrl } = await createSandbox();

      // Validate the runtime values — these must come from the API response
      if (!sandboxId || !previewUrl) {
        throw new Error(
          "Sandbox API returned incomplete data. Expected sandboxId and previewUrl."
        );
      }

      setSandbox({
        sandboxId,   // Dynamic — from the API response only
        previewUrl,  // Dynamic — from the API response only; never constructed here
        status: "ready",
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Sandbox creation failed. Please try again.";

      setError(message);
      setSandbox((prev) => ({ ...prev, status: "error" }));
    } finally {
      // Always release the in-flight lock so future requests are allowed
      inflightRef.current = false;
    }
  }, []); // No dependencies — setSandbox and setError are stable

  /**
   * Reset sandbox state back to idle.
   * Allows the user to intentionally start fresh (e.g. create a new sandbox).
   * Should only be called when no request is in-flight (status !== "creating").
   */
  const resetSandbox = useCallback(() => {
    if (inflightRef.current) return; // Cannot reset mid-flight
    setSandbox({ sandboxId: null, previewUrl: null, status: "idle" });
    setError(null);
  }, []);

  return {
    sandbox,
    startSandbox,
    resetSandbox,
    isCreating: sandbox.status === "creating",
    error,
  };
}
