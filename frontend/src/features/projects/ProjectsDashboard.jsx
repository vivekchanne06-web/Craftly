/**
 * ProjectsDashboard — authenticated home page.
 *
 * Shows the project grid/list, empty state, loading skeleton, start error.
 * Provides "New project" modal and sandbox start provisioning state.
 */

import { useState } from "react";
import { Plus, FolderOpen, AlertCircle, X } from "lucide-react";
import { useProjects } from "./useProjects.js";
import ProjectCard from "./ProjectCard.jsx";
import NewProjectModal from "./NewProjectModal.jsx";
import Button from "../../components/ui/Button.jsx";
import ThemeToggle from "../../components/ui/ThemeToggle.jsx";

/**
 * @param {{
 *   projects: Array,
 *   onProjectCreated: (p: object) => void,
 *   onOpenWorkspace: (project: object, sandbox: object) => void,
 * }} props
 */
export default function ProjectsDashboard({
  projects: initialProjects,
  onProjectCreated,
  onOpenWorkspace,
}) {
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const {
    projects,
    creatingProject,
    createError,
    setCreateError,
    startingProjectId,
    startError,
    clearStartError,
    handleCreateProject,
    handleStartSandbox,
  } = useProjects(initialProjects, { onProjectCreated, onOpenWorkspace });

  return (
    <div
      id="craftly-dashboard"
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
        overflow: "hidden",
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          height: 56,
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 var(--space-6)",
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          gap: "var(--space-4)",
          flexShrink: 0,
          zIndex: "var(--z-overlay)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, var(--color-accent), var(--color-violet))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-text)" }}>
            Craftly
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <ThemeToggle size="sm" />
          <Button
            id="new-project-btn"
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setNewProjectOpen(true)}
          >
            New project
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-8) var(--space-6)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Page title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--space-6)",
              gap: "var(--space-4)",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--color-text)",
                  marginBottom: 2,
                }}
              >
                Projects
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                {projects.length === 0
                  ? "No projects yet"
                  : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          {/* Start error banner */}
          {startError && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-3)",
                padding: "var(--space-4)",
                background: "var(--color-error-dim)",
                border: "1px solid var(--color-error)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--space-5)",
                fontSize: "0.875rem",
                color: "var(--color-error)",
              }}
            >
              <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1 }}>{startError}</span>
              <button
                onClick={clearStartError}
                aria-label="Dismiss error"
                style={{ color: "var(--color-error)", opacity: 0.7, flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Projects grid */}
          {projects.length === 0 ? (
            <EmptyState onNew={() => setNewProjectOpen(true)} />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              {projects.map((project) => {
                const pid = project.id ?? project._id;
                return (
                  <ProjectCard
                    key={pid}
                    project={project}
                    onStart={handleStartSandbox}
                    isStarting={startingProjectId === pid}
                  />
                );
              })}
            </div>
          )}

          {/* Provisioning overlay when starting */}
          {startingProjectId && (
            <ProvisioningState />
          )}
        </div>
      </main>

      {/* New project modal */}
      <NewProjectModal
        open={newProjectOpen}
        onClose={() => { setNewProjectOpen(false); setCreateError(null); }}
        onCreate={handleCreateProject}
        loading={creatingProject}
        error={createError}
      />
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-5)",
        padding: "var(--space-16) var(--space-8)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "var(--radius-xl)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
        }}
      >
        <FolderOpen size={26} aria-hidden="true" />
      </div>
      <div>
        <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
          No projects yet
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", maxWidth: 320, lineHeight: 1.6 }}>
          Create your first project to start building with AI. Each project gets an isolated sandbox.
        </p>
      </div>
      <Button variant="primary" icon={<Plus size={14} />} onClick={onNew}>
        Create your first project
      </Button>
    </div>
  );
}

function ProvisioningState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "var(--space-6)",
        right: "var(--space-6)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4) var(--space-5)",
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        zIndex: "var(--z-toast)",
        maxWidth: 360,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"
        className="spin" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <div>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
          Starting sandbox
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
          Provisioning your workspace…
        </p>
      </div>
    </div>
  );
}
