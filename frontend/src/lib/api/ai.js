/**
 * AI API — SSE streaming via POST /api/ai/invoke (relative path).
 *
 * Backend contract:
 *   POST /api/ai/invoke
 *   Body: { message: string, projectId: string }
 *   Response: text/event-stream with `data: <JSON>\n\n` chunks
 *
 * No absolute URLs. credentials: "include" for cookie auth.
 */

const AI_INVOKE_URL = "/api/ai/invoke";

/**
 * Invokes the AI agent and streams its response.
 *
 * @param {Object} params
 * @param {string} params.message
 * @param {string} params.projectId — The sandbox ID (used as projectId per backend contract)
 * @param {function(string, Object=): void} params.onText
 * @param {function(Object): void} params.onTool
 * @param {function(Error): void} params.onError
 * @param {function(): void} params.onDone
 * @param {AbortSignal} [params.signal]
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
  if (!message?.trim()) throw new Error("Message is required.");
  if (!projectId) throw new Error("A valid projectId (sandboxId) is required.");

  let response;
  try {
    response = await fetch(AI_INVOKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
      },
      credentials: "include",
      body: JSON.stringify({ message: message.trim(), projectId }),
      signal,
    });
  } catch (fetchErr) {
    if (signal?.aborted) { onDone?.(); return; }
    const err = new Error(`Failed to connect to AI service: ${fetchErr.message}`);
    onError?.(err);
    throw err;
  }

  if (!response.ok) {
    let detail = "";
    try { const b = await response.json(); detail = b.error || b.message || ""; } catch { /* */ }
    const err = new Error(
      `AI invocation failed (HTTP ${response.status}).` +
        (detail ? ` Server: ${detail}` : "")
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
      if (signal?.aborted) { await reader.cancel(); break; }

      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("data:")) {
          const raw = trimmed.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            dispatchChunk(parsed, { onText, onTool, onError });
          } catch {
            onText?.(raw);
          }
        }
      }
    }

    // Flush remainder
    if (buffer.trim().startsWith("data:")) {
      const raw = buffer.trim().slice(5).trim();
      if (raw && raw !== "[DONE]") {
        try { dispatchChunk(JSON.parse(raw), { onText, onTool, onError }); }
        catch { onText?.(raw); }
      }
    }

    onDone?.();
  } catch (streamErr) {
    if (signal?.aborted) { onDone?.(); return; }
    onError?.(streamErr);
    throw streamErr;
  } finally {
    try { reader.releaseLock(); } catch { /* */ }
  }
}

/* ── Chunk dispatch ── */

function dispatchChunk(chunk, { onText, onTool, onError }) {
  if (!chunk) return;

  if (chunk.error) {
    onError?.(new Error(typeof chunk.error === "string" ? chunk.error : "AI Agent error"));
    return;
  }

  // LangGraph node formats
  const agentMessages =
    chunk.model?.messages ||
    chunk.agent?.messages ||
    chunk.messages ||
    (Array.isArray(chunk) ? chunk : null);

  if (Array.isArray(agentMessages)) {
    agentMessages.forEach((msg) => processMessage(msg, { onText, onTool }));
    return;
  }

  const toolMessages = chunk.tools?.messages;
  if (Array.isArray(toolMessages)) {
    toolMessages.forEach((msg) =>
      onTool?.({
        type: "result",
        name: msg.name || "tool",
        id: msg.tool_call_id || msg.id,
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
      })
    );
    return;
  }

  if (typeof chunk === "object" && (chunk.content !== undefined || chunk.tool_calls !== undefined)) {
    processMessage(chunk, { onText, onTool });
    return;
  }

  if (typeof chunk === "string") onText?.(chunk);
  else if (chunk.text && typeof chunk.text === "string") onText?.(chunk.text);
}

function processMessage(msg, { onText, onTool }) {
  if (!msg) return;

  const toolCalls = msg.tool_calls || msg.additional_kwargs?.tool_calls;
  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    toolCalls.forEach((call) =>
      onTool?.({
        type: "call",
        id: call.id || call.tool_call_id,
        name: call.name || call.function?.name || "tool",
        args: call.args || call.function?.arguments || {},
      })
    );
  }

  if (msg.type === "tool" || msg.role === "tool") {
    onTool?.({
      type: "result",
      id: msg.tool_call_id || msg.id,
      name: msg.name || "tool",
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
    });
    return;
  }

  if (msg.content) {
    if (typeof msg.content === "string") {
      onText?.(msg.content, { id: msg.id });
    } else if (Array.isArray(msg.content)) {
      msg.content.forEach((part) => {
        if (typeof part === "string") onText?.(part, { id: msg.id });
        else if (part?.text) onText?.(part.text, { id: msg.id });
      });
    }
  }
}
