import { useEffect, useRef } from "react";

/**
 * ChatInput — Prompt input with auto-growing textarea, submit on Enter,
 * and stop button when streaming.
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {function(string): void} props.onChange
 * @param {function(): void} props.onSubmit
 * @param {function(): void} props.onStop
 * @param {boolean} props.isStreaming
 * @param {boolean} [props.disabled]
 */
export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled = false,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${Math.max(nextHeight, 36)}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      if (value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isStreaming) {
          onStop();
        } else if (value.trim()) {
          onSubmit();
        }
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-3)",
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "var(--space-2)",
          padding: "6px 10px",
          borderRadius: "var(--radius-lg)",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          transition: "border-color var(--transition-fast)",
        }}
        onFocus={() => {
          if (textareaRef.current) {
            textareaRef.current.parentElement.style.borderColor = "var(--color-accent)";
          }
        }}
        onBlur={() => {
          if (textareaRef.current) {
            textareaRef.current.parentElement.style.borderColor = "var(--color-border)";
          }
        }}
      >
        <textarea
          ref={textareaRef}
          id="chat-prompt-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled
              ? "Start a sandbox to begin prompting…"
              : isStreaming
              ? "Craftly AI is generating code…"
              : "Describe what you want to build or change…"
          }
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--color-text)",
            fontSize: "0.875rem",
            lineHeight: 1.4,
            padding: "4px 0",
            maxHeight: 120,
            minHeight: 24,
            fontFamily: "inherit",
          }}
        />

        {isStreaming ? (
          <button
            type="button"
            id="chat-stop-btn"
            onClick={onStop}
            title="Stop generating"
            aria-label="Stop generating"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "var(--radius-md)",
              background: "var(--color-error-dim)",
              border: "1px solid var(--color-error)",
              color: "var(--color-error)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all var(--transition-fast)",
            }}
          >
            <StopIcon />
          </button>
        ) : (
          <button
            type="submit"
            id="chat-send-btn"
            disabled={!value.trim() || disabled}
            title="Send prompt"
            aria-label="Send prompt"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "var(--radius-md)",
              background:
                !value.trim() || disabled
                  ? "var(--color-surface-3)"
                  : "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "none",
              color: !value.trim() || disabled ? "var(--color-text-subtle)" : "#ffffff",
              cursor: !value.trim() || disabled ? "not-allowed" : "pointer",
              flexShrink: 0,
              transition: "all var(--transition-fast)",
              boxShadow: !value.trim() || disabled ? "none" : "var(--shadow-sm)",
            }}
          >
            <SendIcon />
          </button>
        )}
      </div>

      {/* Helper caption */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 2px",
          fontSize: "0.6875rem",
          color: "var(--color-text-subtle)",
        }}
      >
        <span>
          <kbd style={{ fontFamily: "var(--font-mono)" }}>Enter</kbd> to send •{" "}
          <kbd style={{ fontFamily: "var(--font-mono)" }}>Shift+Enter</kbd> for newline
        </span>
      </div>
    </form>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
