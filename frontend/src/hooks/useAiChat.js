import { useCallback, useEffect, useRef, useState } from "react";
import { streamAiInvoke } from "../services/aiApi.js";

/**
 * useAiChat — Custom React hook for AI conversation and SSE streaming state.
 *
 * @param {string} projectId - The dynamic runtime sandboxId
 */
export function useAiChat(projectId) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const activeMessageIdRef = useRef(null);

  // Clean up any ongoing stream on unmount or projectId change
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [projectId]);

  /**
   * Stop any in-progress AI stream.
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Mark current assistant message as finished streaming
    if (activeMessageIdRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === activeMessageIdRef.current
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
      activeMessageIdRef.current = null;
    }
  }, []);

  /**
   * Clear all chat messages.
   */
  const clearChat = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

  /**
   * Send a new message to the AI agent.
   */
  const sendMessage = useCallback(
    async (text) => {
      if (!text || !text.trim() || isStreaming) return;

      if (!projectId) {
        setError("Sandbox is not ready. Please start a sandbox first.");
        return;
      }

      setError(null);

      const userMessageId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const assistantMessageId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const userMessage = {
        id: userMessageId,
        role: "user",
        content: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const assistantMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        toolSteps: [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);
      activeMessageIdRef.current = assistantMessageId;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await streamAiInvoke({
          message: text.trim(),
          projectId,
          signal: controller.signal,

          onText: (chunkText) => {
            if (!chunkText) return;
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== assistantMessageId) return msg;

                // If the message already has content and chunkText is an updated full text
                // or incremental append, update cleanly.
                let nextContent = msg.content;
                if (chunkText.startsWith(nextContent)) {
                  nextContent = chunkText;
                } else if (!nextContent.includes(chunkText)) {
                  nextContent = nextContent ? `${nextContent}\n\n${chunkText}` : chunkText;
                }

                return {
                  ...msg,
                  content: nextContent,
                };
              })
            );
          },

          onTool: (toolEvent) => {
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== assistantMessageId) return msg;

                const existingSteps = [...(msg.toolSteps || [])];

                if (toolEvent.type === "call") {
                  // New tool call initiated
                  const stepId = toolEvent.id || `tool-${existingSteps.length + 1}`;
                  const stepIndex = existingSteps.findIndex((s) => s.id === stepId);

                  if (stepIndex >= 0) {
                    existingSteps[stepIndex] = {
                      ...existingSteps[stepIndex],
                      name: toolEvent.name,
                      args: toolEvent.args,
                      status: "running",
                    };
                  } else {
                    existingSteps.push({
                      id: stepId,
                      name: toolEvent.name,
                      args: toolEvent.args,
                      status: "running",
                    });
                  }
                } else if (toolEvent.type === "result") {
                  // Tool result arrived
                  const stepId = toolEvent.id;
                  let found = false;

                  if (stepId) {
                    const stepIndex = existingSteps.findIndex((s) => s.id === stepId);
                    if (stepIndex >= 0) {
                      existingSteps[stepIndex] = {
                        ...existingSteps[stepIndex],
                        status: "completed",
                        output: toolEvent.content,
                      };
                      found = true;
                    }
                  }

                  if (!found) {
                    // Match the last running step or create new completed step
                    const lastRunningIndex = existingSteps
                      .map((s, idx) => ({ ...s, idx }))
                      .filter((s) => s.name === toolEvent.name && s.status === "running")
                      .pop()?.idx;

                    if (lastRunningIndex !== undefined && lastRunningIndex >= 0) {
                      existingSteps[lastRunningIndex] = {
                        ...existingSteps[lastRunningIndex],
                        status: "completed",
                        output: toolEvent.content,
                      };
                    } else {
                      existingSteps.push({
                        id: toolEvent.id || `tool-${existingSteps.length + 1}`,
                        name: toolEvent.name,
                        status: "completed",
                        output: toolEvent.content,
                      });
                    }
                  }
                }

                return {
                  ...msg,
                  toolSteps: existingSteps,
                };
              })
            );
          },

          onError: (err) => {
            setError(err.message || "An error occurred while streaming AI response.");
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false, error: err.message }
                  : msg
              )
            );
          },

          onDone: () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            setIsStreaming(false);
            activeMessageIdRef.current = null;
            abortControllerRef.current = null;
          },
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "Failed to communicate with AI service.");
        }
      } finally {
        setIsStreaming(false);
        activeMessageIdRef.current = null;
        abortControllerRef.current = null;
      }
    },
    [isStreaming, projectId]
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}
