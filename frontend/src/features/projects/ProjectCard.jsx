/**
 * ProjectCard — single project card for the dashboard.
 */

import { Play, Clock } from "lucide-react";
import Button from "../../components/ui/Button.jsx";

/**
 * @param {{
 *   project: { id?: string, _id?: string, title: string, createdAt?: string },
 *   onStart: (project: object) => void,
 *   isStarting: boolean,
 * }} props
 */
export default function ProjectCard({ project, onStart, isStarting }) {
  const id = project.id ?? project._id;
  const createdAt = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <article
      id={`project-card-${id}`}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        transition: "all var(--transition-fast)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-focus)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* Project icon + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-md)",
            background: "var(--color-accent-dim)",
            border: "1px solid var(--color-accent-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.title}
          </h3>
          {createdAt && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Clock size={11} aria-hidden="true" />
              {createdAt}
            </p>
          )}
        </div>
      </div>

      {/* Open builder button */}
      <Button
        id={`open-builder-btn-${id}`}
        variant="primary"
        size="sm"
        loading={isStarting}
        disabled={isStarting}
        icon={isStarting ? undefined : <Play size={12} />}
        onClick={() => onStart(project)}
        aria-label={`Open builder for ${project.title}`}
        style={{ alignSelf: "flex-start" }}
      >
        {isStarting ? "Starting…" : "Open builder"}
      </Button>
    </article>
  );
}
