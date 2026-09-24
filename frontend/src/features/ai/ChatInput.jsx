/**
 * ChatInput — prompt composer with auto-grow textarea.
 *
 * Enter to submit, Shift+Enter for newline.
 * Stop button visible while streaming.
 */

import { useCallback, useEffect, useRef } from "react";
import { Send, Square } from "lucide-react";

/**
 * @param {{
 *   value: string,
 *   onChange: (v: string) => void,
 *   onSubmit: () => void,
 *   onStop: () => void,
 *   isStreaming: boolean,
 *   disabled: boolean,
 * }} props
 */
export default function ChatInput({ value, onChange, onSubmit, onStop, isStreaming, disabled }) {
  const textareaRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim() && !disabled) onSubmit();
    }
  }, [isStreaming, value, disabled, onSubmit]);

  return (
    <div
      style={{
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
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-2) var(--space-3)",
          transition: "border-color var(--transition-fast)",
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = "var(--color-accent)";
        }}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.style.borderColor = "var(--color-border)";
          }
        }}
      >
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Start a sandbox to use AI…" : "Ask AI to build something…"}
          disabled={disabled || isStreaming}
          aria-label="Message to AI assistant"
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            background: "transparent",
            color: "var(--color-text)",
            fontSize: "0.875rem",
            lineHeight: 1.55,
            outline: "none",
            fontFamily: "var(--font-sans)",
            minHeight: 22,
            maxHeight: 160,
            overflow: "auto",
            opacity: disabled ? 0.5 : 1,
          }}
        />

        {isStreaming ? (
          <button
            id="chat-stop-btn"
            onClick={onStop}
            aria-label="Stop AI response"
            title="Stop generating"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: "var(--radius-md)",
              background: "var(--color-error-dim)",
              border: "1px solid var(--color-error)",
              color: "var(--color-error)",
              flexShrink: 0,
              transition: "all var(--transition-fast)",
            }}
          >
            <Square size={13} fill="currentColor" />
          </button>
        ) : (
          <button
            id="chat-send-btn"
            onClick={onSubmit}
            aria-label="Send message"
            title="Send (Enter)"
            disabled={disabled || !value.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: "var(--radius-md)",
              background: disabled || !value.trim() ? "var(--color-surface-3)" : "var(--color-accent)",
              border: "none",
              color: disabled || !value.trim() ? "var(--color-text-subtle)" : "#fff",
              flexShrink: 0,
              opacity: disabled || !value.trim() ? 0.5 : 1,
              transition: "all var(--transition-fast)",
            }}
          >
            <Send size={13} />
          </button>
        )}
      </div>
      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-subtle)", marginTop: "var(--space-1)", textAlign: "center" }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
