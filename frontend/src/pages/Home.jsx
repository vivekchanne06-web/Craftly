import { useEffect, useRef } from "react";

/**
 * Craftly Landing Page
 *
 * Shown when no sandbox is active (status === "idle" or "error").
 * Props:
 *   status     — current sandbox status string
 *   isCreating — true while the API call is in-flight (from useSandbox)
 *   error      — last error message string, or null
 *   onStart    — called when user clicks "Start Sandbox" or "Try Again"
 */
export default function Home({ status, isCreating, error, onStart }) {
  const hasError = status === "error";
  const buttonRef = useRef(null);

  // Focus the button on mount for keyboard accessibility
  useEffect(() => {
    if (!isCreating) {
      buttonRef.current?.focus();
    }
  }, [isCreating]);

  return (
    <main
      id="craftly-home"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8)",
        background: `
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 60%),
          var(--color-bg)
        `,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(var(--color-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-border) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          opacity: 0.3,
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div
        className="fade-in"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: "640px",
          width: "100%",
        }}
      >
        {/* Logo / Brand */}
        <div style={{ marginBottom: "var(--space-6)" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              marginBottom: "var(--space-4)",
            }}
          >
            {/* Craftly icon */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>

            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--color-text)",
              }}
            >
              Craftly
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: "var(--space-4)",
              color: "var(--color-text)",
            }}
          >
            Build with{" "}
            <span className="gradient-text">AI</span>
            {", "}
            <br />
            ship instantly.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "1.0625rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
              maxWidth: "480px",
              margin: "0 auto var(--space-8)",
            }}
          >
            Build, preview, and modify web applications with AI inside an
            isolated sandbox. Describe what you want — Craftly builds it live.
          </p>
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-4)",
          }}
        >
          <button
            ref={buttonRef}
            id="start-sandbox-btn"
            onClick={onStart}
            disabled={isCreating}
            aria-label="Start a new AI sandbox"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "14px 32px",
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: "var(--radius-full)",
              border: "none",
              background: isCreating
                ? "var(--color-surface-3)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: isCreating ? "var(--color-text-muted)" : "white",
              cursor: isCreating ? "not-allowed" : "pointer",
              transition: "all var(--transition-normal)",
              boxShadow: isCreating ? "none" : "var(--shadow-glow)",
              transform: "translateY(0)",
            }}
            onMouseEnter={(e) => {
              if (!isCreating) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 0 32px rgba(99,102,241,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = isCreating
                ? "none"
                : "var(--shadow-glow)";
            }}
          >
            {isCreating ? (
              <>
                <SpinnerIcon />
                Creating sandbox…
              </>
            ) : (
              <>
                <RocketIcon />
                Start Sandbox
              </>
            )}
          </button>

          {/* Status message during creation */}
          {isCreating && (
            <p
              role="status"
              aria-live="polite"
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <span
                className="pulse-dot"
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-accent)",
                }}
              />
              Provisioning your Kubernetes sandbox…
            </p>
          )}

          {/* Error state */}
          {hasError && error && (
            <div
              role="alert"
              style={{
                padding: "var(--space-4)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-error-dim)",
                border: "1px solid var(--color-error)",
                color: "var(--color-error)",
                fontSize: "0.875rem",
                maxWidth: "440px",
                textAlign: "left",
                lineHeight: 1.5,
              }}
            >
              <strong style={{ display: "block", marginBottom: "var(--space-1)" }}>
                Sandbox creation failed
              </strong>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                {error}
              </span>
              <div style={{ marginTop: "var(--space-3)" }}>
                <button
                  id="retry-sandbox-btn"
                  onClick={onStart}
                  disabled={isCreating}
                  aria-label="Retry sandbox creation"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "7px 18px",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-error)",
                    background: "transparent",
                    color: "var(--color-error)",
                    cursor: isCreating ? "not-allowed" : "pointer",
                    transition: "all var(--transition-fast)",
                    opacity: isCreating ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isCreating) {
                      e.currentTarget.style.background = "var(--color-error-dim)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {isCreating ? <SpinnerIcon /> : <RetryIcon />}
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2)",
            justifyContent: "center",
            marginTop: "var(--space-10)",
          }}
        >
          {FEATURES.map((feature) => (
            <FeaturePill key={feature.label} icon={feature.icon} label={feature.label} />
          ))}
        </div>
      </div>
    </main>
  );
}

/* ---- Sub-components ---- */

function FeaturePill({ icon, label }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "6px 14px",
        borderRadius: "var(--radius-full)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-muted)",
        fontSize: "0.8125rem",
        fontWeight: 500,
      }}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

/* ---- Data ---- */

const FEATURES = [
  { icon: "✦", label: "AI-powered development" },
  { icon: "⚡", label: "Live preview" },
  { icon: ">_", label: "Interactive terminal" },
  { icon: "☁", label: "Isolated sandbox" },
];

