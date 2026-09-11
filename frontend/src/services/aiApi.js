import { API_BASE_URL } from "../config/env.js";

/**
 * AI Orchestration API service
 *
 * Communicates with the backend POST /api/ai/invoke endpoint using
 * Server-Sent Events (SSE) streaming over HTTP.
 *
 * Backend Contract:
 *   POST /api/ai/invoke
 *   Headers: { "Content-Type": "application/json" }
 *   Body: { "message": string, "projectId": string }
 *   Response: text/event-stream with `data: <JSON>\n\n`
 */

/**
 * Invokes the AI agent and streams its response chunks in real-time.
 *
 * @param {Object} params
 * @param {string} params.message - The prompt/instruction from the user
 * @param {string} params.projectId - The runtime sandboxId (e.g. "01946fe2-...")
 * @param {function(string, Object=): void} params.onText - Callback for text tokens / content updates
 * @param {function(Object): void} params.onTool - Callback for tool call / execution updates
 * @param {function(Error): void} params.onError - Callback on error
 * @param {function(): void} params.onDone - Callback when stream completes
 * @param {AbortSignal} [params.signal] - AbortSignal to cancel in-flight stream
 * @returns {Promise<void>}
 */
export async function streamAiInvoke({
  message,
  projectId,
  onText,
  onTool,
  onError,
  onDone,
  signal,
}) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required to invoke AI.");
  }

  if (!projectId || typeof projectId !== "string") {
    throw new Error("A valid sandbox projectId is required to invoke AI.");
  }

  const url = `${API_BASE_URL}/api/ai/invoke`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
      },
      body: JSON.stringify({
        message: message.trim(),
        projectId,
      }),
      signal,
    });
  } catch (fetchErr) {
    if (signal?.aborted) {
      // User explicitly stopped streaming
      onDone?.();
      return;
    }
    const err = new Error(
      `Failed to connect to AI service at ${API_BASE_URL}: ${fetchErr.message}`
    );
    onError?.(err);
    throw err;
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorBody = await response.json();
      errorDetail = errorBody.error || errorBody.message || "";
    } catch {
      // non-JSON response body
    }
    const err = new Error(
      `AI invocation failed with HTTP ${response.status}. ` +
        (errorDetail ? `Server message: ${errorDetail}` : "Check backend logs.")
    );
    onError?.(err);
    throw err;
  }

  if (!response.body) {
    const err = new Error("AI service returned an empty response body.");
    onError?.(err);
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split("\n");
      // Keep trailing incomplete fragment in buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("event:")) {
          const eventType = trimmed.slice(6).trim();
          if (eventType === "error") {
            // Handled when data line follows
          }
        } else if (trimmed.startsWith("data:")) {
          const dataContent = trimmed.slice(5).trim();
          if (!dataContent || dataContent === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(dataContent);
            parseAndDispatchChunk(parsed, { onText, onTool, onError });
          } catch {
            // If data is plain text rather than JSON
            onText?.(dataContent);
          }
        }
      }
    }

    // Process any remainder in buffer if present
    if (buffer.trim().startsWith("data:")) {
      const remaining = buffer.trim().slice(5).trim();
      if (remaining && remaining !== "[DONE]") {
        try {
          const parsed = JSON.parse(remaining);
          parseAndDispatchChunk(parsed, { onText, onTool, onError });
        } catch {
          onText?.(remaining);
        }
      }
    }

    onDone?.();
  } catch (streamErr) {
    if (signal?.aborted) {
      onDone?.();
      return;
    }
    onError?.(streamErr);
    throw streamErr;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader lock might already be released
    }
  }
}

/**
 * Parses a LangChain/LangGraph SSE chunk and dispatches text or tool callbacks.
 *
 * @param {any} chunk - The parsed JSON data from the SSE stream
 * @param {Object} callbacks
 * @param {function(string, Object=): void} callbacks.onText
 * @param {function(Object): void} callbacks.onTool
 * @param {function(Error): void} callbacks.onError
 */
function parseAndDispatchChunk(chunk, { onText, onTool, onError }) {
  if (!chunk) return;

  // Case: Backend returned an error payload inside the stream
  if (chunk.error) {
    onError?.(new Error(typeof chunk.error === "string" ? chunk.error : "AI Agent error"));
    return;
  }

  // Case: LangGraph node format { model: { messages: [...] } } or { agent: { messages: [...] } }
  const agentMessages =
    chunk.model?.messages ||
    chunk.agent?.messages ||
    chunk.messages ||
    (Array.isArray(chunk) ? chunk : null);

  if (Array.isArray(agentMessages)) {
    for (const msg of agentMessages) {
      processMessageObject(msg, { onText, onTool });
    }
    return;
  }

  // Case: LangGraph tool node format { tools: { messages: [...] } }
  const toolMessages = chunk.tools?.messages;
  if (Array.isArray(toolMessages)) {
    for (const msg of toolMessages) {
      const toolName = msg.name || "tool";
      const toolOutput = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      onTool?.({
        type: "result",
        name: toolName,
        id: msg.tool_call_id || msg.id,
        content: toolOutput,
      });
    }
    return;
  }

  // Case: Single message object directly
  if (typeof chunk === "object" && (chunk.content !== undefined || chunk.tool_calls !== undefined)) {
    processMessageObject(chunk, { onText, onTool });
    return;
  }

  // Case: Simple text chunk { text: "..." } or plain string
  if (typeof chunk === "string") {
    onText?.(chunk);
  } else if (chunk.text && typeof chunk.text === "string") {
    onText?.(chunk.text);
  }
}

/**
 * Extracts text and tool calls from a LangChain Message object.
 */
function processMessageObject(msg, { onText, onTool }) {
  if (!msg) return;

  // 1. Tool calls attached to the message (AI requesting tool execution)
  const toolCalls = msg.tool_calls || msg.additional_kwargs?.tool_calls;
  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    for (const call of toolCalls) {
      onTool?.({
        type: "call",
        id: call.id || call.tool_call_id,
        name: call.name || call.function?.name || "tool",
        args: call.args || call.function?.arguments || {},
      });
    }
  }

  // 2. Tool result message (type === "tool")
  if (msg.type === "tool" || msg.role === "tool") {
    const toolName = msg.name || "tool";
    const toolOutput = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    onTool?.({
      type: "result",
      id: msg.tool_call_id || msg.id,
      name: toolName,
      content: toolOutput,
    });
    return;
  }

  // 3. Text content
  if (msg.content) {
    if (typeof msg.content === "string") {
      onText?.(msg.content, { id: msg.id });
    } else if (Array.isArray(msg.content)) {
      // Content array (e.g. [{ type: "text", text: "..." }])
      for (const part of msg.content) {
        if (typeof part === "string") {
          onText?.(part, { id: msg.id });
        } else if (part && typeof part.text === "string") {
          onText?.(part.text, { id: msg.id });
        }
      }
    }
  }
}
