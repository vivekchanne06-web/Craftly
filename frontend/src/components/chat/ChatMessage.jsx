import { useState } from "react";

/**
 * ChatMessage — Renders a single message bubble (user or assistant)
 * with tool execution steps, code block highlighting, copy button, and streaming indicator.
 *
 * @param {Object} props
 * @param {Object} props.message
 */
export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className="fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-4)",
        background: isUser ? "var(--color-surface-2)" : "transparent",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Header: Avatar, Name, Timestamp */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isUser
              ? "var(--color-surface-3)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: isUser ? "var(--color-text-muted)" : "#ffffff",
            fontSize: "0.75rem",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {isUser ? <UserIcon /> : <SparklesIcon />}
        </div>

        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          {isUser ? "You" : "Craftly AI"}
        </span>

        {message.timestamp && (
          <span
            style={{
              fontSize: "0.6875rem",
              color: "var(--color-text-subtle)",
              marginLeft: "auto",
            }}
          >
            {message.timestamp}
          </span>
        )}
      </div>

      {/* Tool Execution Steps (for AI assistant messages) */}
      {!isUser && message.toolSteps && message.toolSteps.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-1)",
            margin: "var(--space-1) 0",
          }}
        >
          {message.toolSteps.map((step) => (
            <ToolStepCard key={step.id || step.name} step={step} />
          ))}
        </div>
      )}

      {/* Message Content */}
      <div
        style={{
          fontSize: "0.875rem",
          lineHeight: 1.6,
          color: "var(--color-text)",
          wordBreak: "break-word",
        }}
      >
        {message.content ? (
          <FormattedContent content={message.content} />
        ) : message.isStreaming ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              color: "var(--color-text-muted)",
              fontSize: "0.8125rem",
              padding: "var(--space-1) 0",
            }}
          >
            <span
              className="pulse-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "var(--radius-full)",
                background: "var(--color-accent)",
                display: "inline-block",
              }}
            />
            <span>Thinking & planning changes…</span>
          </div>
        ) : null}

        {/* Streaming cursor */}
        {message.isStreaming && message.content && (
          <span
            className="streaming-cursor"
            style={{ color: "var(--color-accent)", marginLeft: 2 }}
          />
        )}
      </div>

      {/* Error state */}
      {message.error && (
        <div
          role="alert"
          style={{
            marginTop: "var(--space-1)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-error-dim)",
            border: "1px solid var(--color-error)",
            color: "var(--color-error)",
            fontSize: "0.75rem",
          }}
        >
          {message.error}
        </div>
      )}
    </div>
  );
}

/**
 * ToolStepCard — Collapsible card showing tool execution (e.g. list_files, update_files).
 */
function ToolStepCard({ step }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRunning = step.status === "running";

  const getToolLabel = (name) => {
    switch (name) {
      case "list_files":
        return "Inspecting project files";
      case "read_files":
        return "Reading file contents";
      case "update_files":
        return "Modifying project code";
      case "delete_files":
        return "Removing unused files";
      default:
        return `Executing ${name}`;
    }
  };

  const getToolIcon = (name) => {
    switch (name) {
      case "list_files":
        return "🔍";
      case "read_files":
        return "📖";
      case "update_files":
        return "⚡";
      case "delete_files":
        return "🗑️";
      default:
        return "⚙️";
    }
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        fontSize: "0.75rem",
      }}
    >
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "6px 10px",
          background: "transparent",
          color: "var(--color-text-muted)",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span>{getToolIcon(step.name)}</span>
        <span style={{ fontWeight: 500, color: "var(--color-text)" }}>
          {getToolLabel(step.name)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-text-subtle)",
          }}
        >
          ({step.name})
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {isRunning ? (
            <span
              style={{
                color: "var(--color-accent)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ animation: "spin 0.8s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              running
            </span>
          ) : (
            <span style={{ color: "var(--color-success)", fontSize: "0.6875rem" }}>✓ done</span>
          )}
          <span style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}>
            ▾
          </span>
        </div>
      </button>

      {isExpanded && (
        <div
          style={{
            padding: "8px 10px",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-bg)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-text-muted)",
            maxHeight: 180,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {step.args && Object.keys(step.args).length > 0 && (
            <div style={{ marginBottom: "var(--space-2)" }}>
              <span style={{ color: "var(--color-text-subtle)" }}>Arguments: </span>
              {JSON.stringify(step.args, null, 2)}
            </div>
          )}
          {step.output && (
            <div>
              <span style={{ color: "var(--color-text-subtle)" }}>Output: </span>
              {step.output}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * FormattedContent — Parses text into markdown paragraphs, lists, bold text, and code blocks.
 */
function FormattedContent({ content }) {
  if (!content) return null;

  // Split code blocks from regular text
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {parts.map((part, idx) => {
        if (part.startsWith("```")) {
          // Code block
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0].trim();
          const code = lines.slice(lang ? 1 : 0).join("\n");
          return <CodeBlock key={idx} language={lang} code={code} />;
        }

        // Regular markdown text paragraphs
        const paragraphs = part.split("\n\n").filter((p) => p.trim());
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {paragraphs.map((p, pIdx) => (
              <Paragraph key={pIdx} text={p} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Paragraph — Formats inline code, bold text, and bullet lines.
 */
function Paragraph({ text }) {
  const lines = text.split("\n");

  return (
    <p style={{ margin: 0 }}>
      {lines.map((line, lIdx) => {
        const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
        const lineContent = isBullet ? line.trim().slice(2) : line;

        return (
          <span
            key={lIdx}
            style={{
              display: isBullet ? "flex" : "inline",
              alignItems: isBullet ? "flex-start" : undefined,
              gap: isBullet ? "var(--space-2)" : undefined,
              marginTop: isBullet ? 2 : 0,
            }}
          >
            {isBullet && (
              <span style={{ color: "var(--color-accent)", userSelect: "none" }}>•</span>
            )}
            <span>{renderInlineFormatting(lineContent)}</span>
            {lIdx < lines.length - 1 && !isBullet && <br />}
          </span>
        );
      })}
    </p>
  );
}

/**
 * renderInlineFormatting — parses `inline code` and **bold** text.
 */
function renderInlineFormatting(text) {
  // Split on inline code `...` and bold **...**
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return tokens.map((token, index) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return (
        <code
          key={index}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            padding: "2px 5px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-surface-2)",
            color: "var(--color-accent)",
            border: "1px solid var(--color-border)",
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return (
        <strong key={index} style={{ fontWeight: 600, color: "var(--color-text)" }}>
          {token.slice(2, -2)}
        </strong>
      );
    }

    return token;
  });
}

/**
 * CodeBlock — syntax formatted code block with copy button.
 */
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        margin: "var(--space-2) 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 10px",
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          fontSize: "0.6875rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", textTransform: "lowercase" }}>
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: copied ? "var(--color-success)" : "var(--color-text-muted)",
            fontSize: "0.6875rem",
            cursor: "pointer",
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "10px 12px",
          overflowX: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          lineHeight: 1.5,
          color: "var(--color-text)",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
