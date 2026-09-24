/**
 * ChatPanel — full AI conversation panel.
 *
 * Shows messages list, suggested starter prompts, input composer.
 * Calls onComplete() after each AI stream finishes (triggers file+preview refresh).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, AlertCircle, Trash2, RefreshCw } from "lucide-react";
import PanelHeader from "../../components/ui/PanelHeader.jsx";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";
import { useAiChat } from "./useAiChat.js";

const STARTER_PROMPTS = [
  "Create a counter app with +/- buttons",
  "Build a to-do list with local storage",
  "Add a dark mode toggle to the page",
  "Make the landing page fully responsive",
];

/**
 * @param {{
 *   sandbox: { sandboxId: string },
 *   onComplete: () => void,
 * }} props
 */
export default function ChatPanel({ sandbox, onComplete }) {
  const sandboxId = sandbox?.sandboxId;
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearChat } = useAiChat(
    sandboxId,
    { onComplete }
  );

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !sandboxId) return;
    setInput("");
    sendMessage(trimmed);
  }, [input, isStreaming, sandboxId, sendMessage]);

  const handleStarter = useCallback((prompt) => {
    if (isStreaming || !sandboxId) return;
    sendMessage(prompt);
  }, [isStreaming, sandboxId, sendMessage]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <PanelHeader
        icon={<Sparkles size={15} />}
        label="AI Assistant"
        extra={
          messages.length > 0 ? (
            <button
              id="chat-clear-btn"
              title="Clear conversation"
              aria-label="Clear conversation"
              onClick={clearChat}
              disabled={isStreaming}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "var(--radius-sm)", color: "var(--color-text-muted)", opacity: isStreaming ? 0.4 : 1, transition: "color var(--transition-fast)" }}
              onMouseEnter={(e) => { if (!isStreaming) e.currentTarget.style.color = "var(--color-text)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
            >
              <Trash2 size={13} />
            </button>
          ) : undefined
        }
      />

      {/* Messages area */}
      <div className="panel-scroll" style={{ flex: 1 }}>
        {messages.length === 0 ? (
          <EmptyState
            sandboxId={sandboxId}
            onStarter={handleStarter}
            isStreaming={isStreaming}
          />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)", padding: "var(--space-3) var(--space-4)", background: "var(--color-error-dim)", borderTop: "1px solid var(--color-error)", fontSize: "0.75rem", color: "var(--color-error)" }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => sendMessage(messages.filter((m) => m.role === "user").pop()?.content ?? "")}
            title="Retry last message"
            aria-label="Retry last message"
            style={{ color: "var(--color-error)", flexShrink: 0 }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      )}

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        disabled={!sandboxId}
      />
    </div>
  );
}

function EmptyState({ sandboxId, onStarter, isStreaming }) {
  if (!sandboxId) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--space-6)", textAlign: "center", gap: "var(--space-4)", color: "var(--color-text-muted)" }}>
        <Sparkles size={24} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
          The AI assistant will be available once the sandbox is running.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-5) var(--space-4)" }}>
      <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--color-accent), var(--color-violet))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
          <Sparkles size={18} style={{ color: "#fff" }} />
        </div>
        <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-1)" }}>Craftly AI</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          Describe what you'd like to build or change. I'll update the files and refresh the preview.
        </p>
      </div>

      <div>
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-subtle)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "var(--space-3)" }}>Try asking</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onStarter(prompt)}
              disabled={isStreaming}
              style={{
                width: "100%",
                padding: "var(--space-3) var(--space-4)",
                textAlign: "left",
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                cursor: isStreaming ? "not-allowed" : "pointer",
                transition: "all var(--transition-fast)",
                opacity: isStreaming ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!isStreaming) { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-text)"; }}}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
