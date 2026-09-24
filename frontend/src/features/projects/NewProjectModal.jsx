/**
 * NewProjectModal — modal for creating a new project with title validation.
 */

import { useEffect, useRef, useState } from "react";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onCreate: (title: string) => Promise<boolean>,
 *   loading: boolean,
 *   error: string|null,
 * }} props
 */
export default function NewProjectModal({ open, onClose, onCreate, loading, error }) {
  const [title, setTitle] = useState("");
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);

  // Reset state when modal opens
  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setTitle("");
    setLocalError("");
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setLocalError("Project title is required.");
      return;
    }
    if (trimmed.length < 2) {
      setLocalError("Title must be at least 2 characters.");
      return;
    }
    setLocalError("");
    const success = await onCreate(trimmed);
    if (success) {
      onClose();
    }
  };

  const displayError = localError || error;

  return (
    <Modal open={open} onClose={onClose} title="New Project">
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div>
            <label
              htmlFor="project-title-input"
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-text)",
                marginBottom: "var(--space-2)",
              }}
            >
              Project name
            </label>
            <input
              ref={inputRef}
              id="project-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (localError) setLocalError("");
              }}
              placeholder="My awesome app"
              maxLength={80}
              disabled={loading}
              aria-describedby={displayError ? "project-title-error" : undefined}
              aria-invalid={!!displayError}
              style={{
                width: "100%",
                padding: "9px var(--space-3)",
                fontSize: "0.9375rem",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${displayError ? "var(--color-error)" : "var(--color-border)"}`,
                background: "var(--color-surface-2)",
                color: "var(--color-text)",
                outline: "none",
                transition: "border-color var(--transition-fast)",
              }}
              onFocus={(e) => {
                if (!displayError)
                  e.currentTarget.style.borderColor = "var(--color-accent)";
              }}
              onBlur={(e) => {
                if (!displayError)
                  e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            />
            {displayError && (
              <p
                id="project-title-error"
                role="alert"
                style={{
                  marginTop: "var(--space-2)",
                  fontSize: "0.75rem",
                  color: "var(--color-error)",
                }}
              >
                {displayError}
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--space-2)",
              paddingTop: "var(--space-2)",
            }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || !title.trim()}
            >
              Create project
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
