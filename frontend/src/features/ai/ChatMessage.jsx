/**
 * ChatMessage — renders a single message (user or assistant).
 *
 * Assistant messages show:
 *  - Tool steps with call/running/completed states
 *  - Streaming text with blinking cursor
 *  - Error state
 */

import { useState } from "react";
import { User, Sparkles, ChevronDown, ChevronRight, Wrench, Check, AlertCircle } from "lucide-react";

/**
 * @param {{ message: object }} props
 */
export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        padding: "var(--space-4) var(--space-4)",
        borderBottom: "1px solid var(--color-border)",
        background: isUser ? "transparent" : "var(--color-surface-2)",
      }}
    >
      {/* Role label */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: isUser ? "var(--color-surface-3)" : "linear-gradient(135deg, var(--color-accent), var(--color-violet))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isUser
            ? <User size={12} style={{ color: "var(--color-text-muted)" }} />
            : <Sparkles size={11} style={{ color: "#fff" }} />}
        </div>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
          {isUser ? "You" : "Craftly AI"}
        </span>
        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-subtle)", marginLeft: "auto" }}>
          {message.timestamp}
        </span>
      </div>

      {/* Tool steps */}
      {!isUser && message.toolSteps?.length > 0 && (
        <div style={{ marginBottom: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {message.toolSteps.map((step, i) => (
            <ToolStep key={step.id || i} step={step} />
          ))}
        </div>
      )}

      {/* Content */}
      {message.content && (
        <p
          className={message.isStreaming && !message.content ? undefined : message.isStreaming ? "streaming-cursor" : undefined}
          style={{
            fontSize: "0.875rem",
            lineHeight: 1.65,
            color: "var(--color-text)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message.content}
          {message.isStreaming && !message.content && (
            <span style={{ display: "inline-block", animation: "blink 1s step-end infinite", color: "var(--color-accent)" }}>▋</span>
          )}
        </p>
      )}

      {/* Loading state — no content yet but streaming */}
      {!isUser && message.isStreaming && !message.content && !message.toolSteps?.length && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span style={{ display: "inline-block", animation: "blink 1s step-end infinite", color: "var(--color-accent)", fontSize: "1.2em" }}>▋</span>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Thinking…</span>
        </div>
      )}

      {/* Error */}
      {message.error && (
        <div style={{ marginTop: "var(--space-2)", display: "flex", alignItems: "flex-start", gap: "var(--space-2)", fontSize: "0.8125rem", color: "var(--color-error)" }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{message.error}</span>
        </div>
      )}
    </div>
  );
}

function ToolStep({ step }) {
  const [open, setOpen] = useState(false);

  const icon = step.status === "completed"
    ? <Check size={11} style={{ color: "var(--color-success)" }} />
    : step.status === "running"
    ? <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid var(--color-accent)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
    : <Wrench size={11} style={{ color: "var(--color-text-muted)" }} />;

  return (
    <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "5px 10px",
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "var(--color-text-muted)",
          background: "transparent",
          textAlign: "left",
        }}
      >
        {icon}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>{step.name}</code>
          {step.status === "running" && <span style={{ marginLeft: 6, color: "var(--color-warning)", fontSize: "0.6875rem" }}>running</span>}
          {step.status === "completed" && <span style={{ marginLeft: 6, color: "var(--color-success)", fontSize: "0.6875rem" }}>done</span>}
        </span>
        {(step.args || step.output) && (open ? <ChevronDown size={11} /> : <ChevronRight size={11} />)}
      </button>
      {open && (step.args || step.output) && (
        <div style={{ padding: "6px 10px 8px", borderTop: "1px solid var(--color-border)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 160, overflowY: "auto" }}>
          {step.args && typeof step.args === "object" && JSON.stringify(step.args, null, 2)}
          {step.output && <div style={{ marginTop: 6, color: "var(--color-text-subtle)" }}>{typeof step.output === "string" ? step.output.slice(0, 400) : JSON.stringify(step.output).slice(0, 400)}</div>}
        </div>
      )}
    </div>
  );
}
