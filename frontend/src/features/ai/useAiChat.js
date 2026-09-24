/**
 * useAiChat — AI conversation and SSE streaming state.
 * Uses lib/api/ai.js (relative URL, credentials: include).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { streamAiInvoke } from "../../lib/api/ai.js";

/**
 * @param {string} projectId — The sandbox ID
 * @param {{ onComplete?: () => void }} callbacks
 */
export function useAiChat(projectId, { onComplete } = {}) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const activeIdRef = useRef(null);

  // Clean up on unmount or projectId change
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, [projectId]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    if (activeIdRef.current) {
      setMessages((prev) =>
        prev.map((m) => m.id === activeIdRef.current ? { ...m, isStreaming: false } : m)
      );
      activeIdRef.current = null;
    }
  }, []);

  const clearChat = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isStreaming) return;
    if (!projectId) {
      setError("Sandbox is not active. Please start a sandbox first.");
      return;
    }

    setError(null);
    const userId = `user-${Date.now()}`;
    const aiId = `ai-${Date.now()}`;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: text.trim(), timestamp },
      { id: aiId, role: "assistant", content: "", toolSteps: [], timestamp, isStreaming: true },
    ]);
    setIsStreaming(true);
    activeIdRef.current = aiId;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAiInvoke({
        message: text.trim(),
        projectId,
        signal: controller.signal,

        onText: (chunk) => {
          if (!chunk) return;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== aiId) return m;
              let next = m.content;
              if (chunk.startsWith(next)) next = chunk;
              else if (!next.includes(chunk)) next = next ? `${next}\n\n${chunk}` : chunk;
              return { ...m, content: next };
            })
          );
        },

        onTool: (event) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== aiId) return m;
              const steps = [...(m.toolSteps || [])];
              if (event.type === "call") {
                const stepId = event.id || `tool-${steps.length + 1}`;
                const idx = steps.findIndex((s) => s.id === stepId);
                if (idx >= 0) steps[idx] = { ...steps[idx], name: event.name, args: event.args, status: "running" };
                else steps.push({ id: stepId, name: event.name, args: event.args, status: "running" });
              } else if (event.type === "result") {
                const idx = event.id ? steps.findIndex((s) => s.id === event.id) : -1;
                if (idx >= 0) {
                  steps[idx] = { ...steps[idx], status: "completed", output: event.content };
                } else {
                  const lastRunning = [...steps].reverse().findIndex((s) => s.name === event.name && s.status === "running");
                  if (lastRunning >= 0) steps[steps.length - 1 - lastRunning] = { ...steps[steps.length - 1 - lastRunning], status: "completed", output: event.content };
                  else steps.push({ id: event.id || `tool-r-${steps.length}`, name: event.name, status: "completed", output: event.content });
                }
              }
              return { ...m, toolSteps: steps };
            })
          );
        },

        onError: (err) => {
          setError(err.message || "An error occurred during streaming.");
          setMessages((prev) =>
            prev.map((m) => m.id === aiId ? { ...m, isStreaming: false, error: err.message } : m)
          );
        },

        onDone: () => {
          setMessages((prev) =>
            prev.map((m) => m.id === aiId ? { ...m, isStreaming: false } : m)
          );
          setIsStreaming(false);
          activeIdRef.current = null;
          abortRef.current = null;
          onComplete?.();
        },
      });
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.message || "Failed to communicate with AI service.");
      }
    } finally {
      setIsStreaming(false);
      activeIdRef.current = null;
      abortRef.current = null;
    }
  }, [isStreaming, projectId, onComplete]);

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearChat };
}
