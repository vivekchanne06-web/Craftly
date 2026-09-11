import { useEffect, useRef, useState } from "react";
import { useAiChat } from "../../hooks/useAiChat.js";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";

/**
 * ChatPanel — AI coding assistant with real-time SSE streaming.
 *
 * Communicates with POST /api/ai/invoke passing `{ message, projectId }`
 * where `projectId` is the runtime `sandbox.sandboxId`.
 *
 * @param {{ sandbox: { sandboxId: string, previewUrl: string, status: string } }} props
 */
export default function ChatPanel({ sandbox = {} }) {
  const projectId = sandbox?.sandboxId;
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearChat } =
    useAiChat(projectId);

  const [inputPrompt, setInputPrompt] = useState("");
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom when messages update or during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = () => {
    if (!inputPrompt.trim() || isStreaming) return;
    const promptToSend = inputPrompt;
    setInputPrompt("");
    sendMessage(promptToSend);
  };

  const handleSuggestedPrompt = (suggestion) => {
    if (isStreaming) return;
    sendMessage(suggestion);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "var(--color-surface)",
      }}
    >
      {/* ── Panel Header ── */}
      <PanelHeader
        icon={<SparklesIcon />}
        label="AI Assistant"
        badge={isStreaming ? "Streaming" : "Ready"}
        extra={
          messages.length > 0 && (
            <button
              id="clear-chat-btn"
              onClick={clearChat}
              title="Clear chat history"
              aria-label="Clear chat history"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                border: "none",
                color: "var(--color-text-subtle)",
                cursor: "pointer",
                transition: "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-subtle)")}
            >
              <TrashIcon />
            </button>
          )
        }
      />

      {/* ── Message List / Empty State ── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.length === 0 ? (
          <EmptyChatState
            onSelectPrompt={handleSuggestedPrompt}
          />
        ) : (
          <div>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} style={{ height: 1 }} />
          </div>
        )}
      </div>

      {/* ── Global Error Banner ── */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "var(--space-2) var(--space-3)",
            background: "var(--color-error-dim)",
            borderTop: "1px solid var(--color-error)",
            color: "var(--color-error)",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <span>⚠</span>
          <span style={{ flex: 1 }}>{error}</span>
        </div>
      )}

      {/* ── Chat Input ── */}
      <ChatInput
        value={inputPrompt}
        onChange={setInputPrompt}
        onSubmit={handleSend}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        disabled={!projectId}
      />
    </div>
  );
}

/**
 * EmptyChatState — Displayed when no conversation has started yet.
 */
function EmptyChatState({ onSelectPrompt }) {
  const suggestions = [
    "Build a modern SaaS landing page with hero, features, and pricing",
    "Add a responsive navigation bar with dark mode toggle",
    "Create a clean dashboard with analytics metric cards",
    "Build a contact form with live input validation",
  ];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6) var(--space-4)",
        textAlign: "center",
        gap: "var(--space-4)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
          border: "1px solid var(--color-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-accent)",
        }}
      >
        <SparklesIcon size={22} />
      </div>

      <div>
        <p
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--color-text)",
            marginBottom: "var(--space-1)",
          }}
        >
          What would you like to build?
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            maxWidth: 280,
            lineHeight: 1.5,
          }}
        >
          Describe features or changes. The AI agent will inspect your sandbox code, modify files, and build live.
        </p>
      </div>

      {/* Suggested prompt chips */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          width: "100%",
          maxWidth: 320,
        }}
      >
        {suggestions.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(item)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              fontSize: "0.75rem",
              textAlign: "left",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.background = "var(--color-surface-3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.background = "var(--color-surface-2)";
            }}
          >
            <span style={{ color: "var(--color-accent)", fontSize: "0.8125rem" }}>✦</span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SHARED PANEL HEADER COMPONENT
   (Retained for workspace consistency across panels)
   ══════════════════════════════════════════════════════════════ */

export function PanelHeader({ icon, label, badge, extra }) {
  return (
    <div
      style={{
        height: 40,
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "0 var(--space-3)",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
      }}
    >
      <span style={{ color: "var(--color-text-muted)", display: "flex" }}>{icon}</span>
      <span
        style={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--color-text)",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1 }} />
      {badge && (
        <span
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            color: "var(--color-accent)",
            background: "var(--color-accent-dim)",
            border: "1px solid var(--color-accent)",
            borderRadius: "var(--radius-full)",
            padding: "1px 7px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {badge}
        </span>
      )}
      {extra && extra}
    </div>
  );
}

function SparklesIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
