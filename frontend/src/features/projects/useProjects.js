/**
 * useProjects — hook managing project list state and sandbox starting.
 */

import { useCallback, useState } from "react";
import { createProject, startSandbox } from "../../lib/api/projects.js";

/**
 * @param {Array} initialProjects — Projects already loaded by App.jsx auth check
 * @param {{ onProjectCreated: (p) => void, onOpenWorkspace: (project, sandbox) => void }} callbacks
 */
export function useProjects(initialProjects, { onProjectCreated, onOpenWorkspace }) {
  const [projects, setProjects] = useState(initialProjects);
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [startingProjectId, setStartingProjectId] = useState(null);
  const [startError, setStartError] = useState(null);

  const handleCreateProject = useCallback(
    async (title) => {
      if (!title?.trim() || creatingProject) return;
      setCreatingProject(true);
      setCreateError(null);

      try {
        const { project } = await createProject(title.trim());
        setProjects((prev) => [project, ...prev]);
        onProjectCreated?.(project);
        return true; // success signal to close modal
      } catch (err) {
        setCreateError(err.message || "Failed to create project.");
        return false;
      } finally {
        setCreatingProject(false);
      }
    },
    [creatingProject, onProjectCreated]
  );

  const handleStartSandbox = useCallback(
    async (project) => {
      if (startingProjectId) return; // guard duplicate
      setStartingProjectId(project.id ?? project._id);
      setStartError(null);

      try {
        const sandbox = await startSandbox(project.id ?? project._id);
        onOpenWorkspace?.(project, sandbox);
      } catch (err) {
        setStartError(err.message || "Failed to start sandbox.");
        setStartingProjectId(null);
      }
    },
    [startingProjectId, onOpenWorkspace]
  );

  const clearStartError = useCallback(() => setStartError(null), []);

  return {
    projects,
    creatingProject,
    createError,
    setCreateError,
    startingProjectId,
    startError,
    clearStartError,
    handleCreateProject,
    handleStartSandbox,
  };
}
