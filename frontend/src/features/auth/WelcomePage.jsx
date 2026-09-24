/**
 * WelcomePage — Unauthenticated landing screen.
 *
 * Shows the Craftly brand and a single "Continue with Google" CTA.
 * Google login is initiated via a normal navigation to /api/auth/google.
 * No email/password form. No invented sign-up flow.
 */

import { Zap, Eye, Terminal, Box } from "lucide-react";

const FEATURES = [
  { icon: Zap, label: "AI-powered development" },
  { icon: Eye, label: "Live preview" },
  { icon: Terminal, label: "Interactive terminal" },
  { icon: Box, label: "Isolated sandbox" },
];

/**
 * @param {{ authError?: string|null }} props
 */
export default function WelcomePage({ authError }) {
  return (
    <main
      id="craftly-welcome"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8)",
        background: "var(--color-bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial accent behind content */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, var(--color-accent-subtle) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Grid pattern */}
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
          opacity: 0.25,
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        className="fade-in"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: 600,
          width: "100%",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-3)",
            marginBottom: "var(--space-8)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-lg)",
              background:
                "linear-gradient(135deg, var(--color-accent), var(--color-violet))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-glow)",
              flexShrink: 0,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
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
              fontSize: "1.75rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
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
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            marginBottom: "var(--space-5)",
            color: "var(--color-text)",
          }}
        >
          Build web apps{" "}
          <span className="gradient-text">with AI,</span>
          <br />
          ship instantly.
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--color-text-muted)",
            lineHeight: 1.65,
            maxWidth: 440,
            margin: "0 auto var(--space-10)",
          }}
        >
          Describe what you want to build. Craftly spins up an isolated sandbox,
          runs your AI agent, and shows a live preview — all in your browser.
        </p>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-4)",
          }}
        >
          <a
            href="/api/auth/google"
            id="google-login-link"
            aria-label="Continue with Google"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-3)",
              padding: "12px 28px",
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              cursor: "pointer",
              transition: "all var(--transition-normal)",
              boxShadow: "var(--shadow-md)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.boxShadow = "var(--shadow-glow)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <GoogleLogo />
            Continue with Google
          </a>

          {/* Auth error (e.g. network failure during initial check) */}
          {authError && (
            <p
              role="alert"
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-error)",
                background: "var(--color-error-dim)",
                border: "1px solid var(--color-error)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3) var(--space-4)",
                maxWidth: 400,
                lineHeight: 1.5,
              }}
            >
              {authError}
            </p>
          )}

          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-subtle)",
            }}
          >
            No account creation required — sign in with your Google account.
          </p>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2)",
            justifyContent: "center",
            marginTop: "var(--space-12)",
          }}
        >
          {FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
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
              <Icon size={13} aria-hidden="true" style={{ color: "var(--color-accent)" }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
