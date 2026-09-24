/**
 * App — top-level state machine and routing.
 *
 * Auth detection: GET /api/sandbox/project
 *   401  → <WelcomePage> (unauthenticated)
 *   200  → <ProjectsDashboard> (authenticated)
 *   workspace selected → <WorkspacePage>
 *
 * No fake user state. Authentication is determined solely by the
 * projects endpoint response code.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeProvider } from "./ThemeContext.jsx";
import { getProjects } from "../lib/api/projects.js";
import WelcomePage from "../features/auth/WelcomePage.jsx";
import ProjectsDashboard from "../features/projects/ProjectsDashboard.jsx";
import WorkspacePage from "../features/workspace/WorkspacePage.jsx";

/**
 * @typedef {"checking"|"unauthenticated"|"dashboard"|"workspace"} AppView
 */

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  /** @type {[AppView, function]} */
  const [view, setView] = useState("checking");
  const [projects, setProjects] = useState([]);
  const [authError, setAuthError] = useState(null);

  // Workspace state — only set when entering workspace view
  const [activeProject, setActiveProject] = useState(null);  // { id, title, ... }
  const [sandbox, setSandbox] = useState(null);               // { sandboxId, previewUrl }

  const inflightRef = useRef(false);

  /** Check auth by hitting the projects endpoint (called on user actions/retry/exit). */
  const checkAuth = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setView("checking");
    setAuthError(null);

    try {
      const result = await getProjects();
      if (result.authenticated) {
        setProjects(result.projects);
        setView("dashboard");
      } else {
        setView("unauthenticated");
      }
    } catch (err) {
      setAuthError(err.message);
      setView("unauthenticated");
    } finally {
      inflightRef.current = false;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    inflightRef.current = true;

    getProjects(controller.signal)
      .then((result) => {
        if (result.authenticated) {
          setProjects(result.projects);
          setView("dashboard");
        } else {
          setView("unauthenticated");
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setAuthError(err.message);
        setView("unauthenticated");
      })
      .finally(() => {
        inflightRef.current = false;
      });

    return () => controller.abort();
  }, []);

  /** Called when a project + sandbox are ready; switches to workspace. */
  const handleOpenWorkspace = useCallback((project, sandboxData) => {
    setActiveProject(project);
    setSandbox(sandboxData);
    setView("workspace");
  }, []);

  /** Return to dashboard from workspace. */
  const handleExitWorkspace = useCallback(() => {
    setSandbox(null);
    setActiveProject(null);
    setView("checking");
    setAuthError(null);
    // Re-fetch projects to pick up any newly created ones
    checkAuth();
  }, [checkAuth]);

  /** Called after project creation so dashboard can add the new project. */
  const handleProjectCreated = useCallback((newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  }, []);

  if (view === "checking") {
    return <AppLoading />;
  }

  if (view === "unauthenticated") {
    return <WelcomePage authError={authError} />;
  }

  if (view === "workspace" && activeProject && sandbox) {
    return (
      <WorkspacePage
        project={activeProject}
        sandbox={sandbox}
        onExit={handleExitWorkspace}
      />
    );
  }

  return (
    <ProjectsDashboard
      projects={projects}
      onProjectCreated={handleProjectCreated}
      onOpenWorkspace={handleOpenWorkspace}
    />
  );
}

function AppLoading() {
  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        gap: "var(--space-3)",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-md)",
          background: "linear-gradient(135deg, var(--color-accent), var(--color-violet))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"
        className="spin" aria-label="Loading" role="status">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  );
}
