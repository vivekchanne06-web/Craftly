/**
 * useFiles — file tree state for the active sandbox.
 */

import { useCallback, useEffect, useState } from "react";
import { listFiles, createFile, deleteFiles } from "../../lib/api/agent.js";
import { validateAgentConfig } from "../../lib/config/env.js";

/**
 * @param {string} sandboxId
 * @param {number} [refreshToken] — increment to force refresh
 */
export function useFiles(sandboxId, refreshToken = 0) {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState(sandboxId ? "loading" : "idle"); // idle | loading | ready | error | config-error
  const [errorMsg, setErrorMsg] = useState(null);

  const { valid: configValid, error: configError } = validateAgentConfig();

  // Reset/update state when sandboxId or refreshToken changes
  const [prevKey, setPrevKey] = useState(`${sandboxId}:${refreshToken}`);
  const currentKey = `${sandboxId}:${refreshToken}`;
  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    setStatus(sandboxId ? "loading" : "idle");
    setErrorMsg(null);
    if (!sandboxId) setFiles([]);
  }

  // Fetch file list when sandboxId or refreshToken changes
  useEffect(() => {
    if (!sandboxId || !configValid) return;

    const ctrl = new AbortController();
    listFiles(sandboxId, ctrl.signal)
      .then((fileList) => {
        setFiles(fileList);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setErrorMsg(err.message || "Failed to load files.");
        setStatus("error");
      });

    return () => ctrl.abort();
  }, [sandboxId, refreshToken, configValid]);

  const refresh = useCallback(() => {
    if (!sandboxId || !configValid) return;
    setStatus("loading");
    setErrorMsg(null);
    listFiles(sandboxId)
      .then((fileList) => {
        setFiles(fileList);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load files.");
        setStatus("error");
      });
  }, [sandboxId, configValid]);

  const handleCreateFile = useCallback(
    async (filePath) => {
      if (!sandboxId || !filePath) return;
      await createFile(sandboxId, filePath, "");
      refresh();
    },
    [sandboxId, refresh]
  );

  const handleDeleteFile = useCallback(
    async (filePath) => {
      if (!sandboxId || !filePath) return;
      await deleteFiles(sandboxId, [filePath]);
      setFiles((prev) => prev.filter((f) => f !== filePath));
    },
    [sandboxId]
  );

  const effectiveStatus = !configValid ? "config-error" : status;
  const effectiveError = !configValid ? configError : errorMsg;

  return {
    files,
    status: effectiveStatus,
    errorMsg: effectiveError,
    refresh,
    handleCreateFile,
    handleDeleteFile,
  };
}
