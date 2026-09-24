import { useCallback, useEffect, useState } from "react";
import { listFiles } from "../../lib/api/agent.js";
import { validateAgentConfig } from "../../lib/config/env.js";

const RETRY_DELAY_MS = 2000;
const MAX_ATTEMPTS = 30;

/**
 * The sandbox API confirms that Kubernetes accepted the create request, not
 * that the agent and preview containers are ready. Probe the agent before
 * mounting workspace panels so they do not fail permanently during startup.
 */
export function useSandboxReadiness(sandboxId) {
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState(sandboxId ? "starting" : "idle");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(null);
  const config = validateAgentConfig();

  const retry = useCallback(() => {
    setStatus("starting");
    setAttempt(0);
    setError(null);
    setRun((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!sandboxId || !config.valid) return undefined;

    let cancelled = false;
    let timerId;
    let currentAttempt = 0;
    let controller;

    const probe = async () => {
      currentAttempt += 1;
      setAttempt(currentAttempt);
      setStatus("starting");
      setError(null);
      controller = new AbortController();

      try {
        await listFiles(sandboxId, controller.signal);
        if (!cancelled) setStatus("ready");
      } catch (probeError) {
        if (cancelled || probeError?.name === "AbortError") return;

        if (currentAttempt >= MAX_ATTEMPTS) {
          setStatus("error");
          setError(
            "The sandbox agent did not become ready. Check that the sandbox pod and ingress are running, then try again."
          );
          return;
        }

        timerId = window.setTimeout(probe, RETRY_DELAY_MS);
      }
    };

    timerId = window.setTimeout(probe, 0);

    return () => {
      cancelled = true;
      controller?.abort();
      window.clearTimeout(timerId);
    };
  }, [sandboxId, run, config.valid]);

  const effectiveStatus = !sandboxId
    ? "idle"
    : !config.valid
      ? "config-error"
      : status;

  return {
    status: effectiveStatus,
    attempt,
    error: !config.valid ? config.error : error,
    retry,
  };
}
