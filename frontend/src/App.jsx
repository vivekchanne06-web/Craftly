import "./index.css";
import { useSandbox } from "./hooks/useSandbox.js";
import Home from "./pages/Home.jsx";
import Workspace from "./pages/Workspace.jsx";

/**
 * Craftly Application Root
 *
 * State-driven routing:
 *   sandbox.status === "ready"  →  Workspace (full developer environment)
 *   otherwise                   →  Home (landing page)
 *
 * The sandbox state { sandboxId, previewUrl, status } is managed by useSandbox
 * and passed as a single prop to Workspace, which fans it out to all panels.
 * It is never duplicated inside individual components.
 */
function App() {
  const { sandbox, startSandbox, resetSandbox, isCreating, error } = useSandbox();

  if (sandbox.status === "ready" && sandbox.sandboxId) {
    return (
      <Workspace
        sandbox={sandbox}
        onNewSandbox={resetSandbox}
      />
    );
  }

  return (
    <Home
      status={sandbox.status}
      error={error}
      isCreating={isCreating}
      onStart={startSandbox}
    />
  );
}

export default App;
