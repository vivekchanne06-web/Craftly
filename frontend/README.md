# Craftly Frontend

React 19 + Vite + Tailwind CSS v4 frontend for the Craftly AI web-app builder.

## Quick start

```bash
cp .env.example .env        # fill in your env values
npm install
npm run dev
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_AGENT_URL_TEMPLATE` | Yes (for workspace) | Per-sandbox agent URL template. Must contain `{sandboxId}`. Example: `http://{sandboxId}.agent.localhost:8080` |
| `VITE_DEV_PROXY_TARGET` | Yes (dev only) | Backend URL for Vite's `/api` proxy. Example: `http://127.0.0.1:8080` |

**No other frontend env variables are needed or supported.**

- `VITE_API_BASE_URL` — **removed.** All first-party requests use relative paths (`/api/…`), routed by Vite's dev proxy in development or a real ingress in production.
- `VITE_AGENT_BASE_URL` — **removed.** Replaced by `VITE_AGENT_URL_TEMPLATE`.

### URL policy

All code in `frontend/src` must follow these rules strictly:

1. **First-party requests** (`/api/…`) use relative paths only. No absolute URL or hostname.
2. **Preview URL** is used exactly as returned by the backend (`POST /api/sandbox/start → previewUrl`). The frontend never constructs or modifies it.
3. **Agent URL** is built exclusively from `VITE_AGENT_URL_TEMPLATE` via `src/lib/config/env.js#getAgentUrl()`. No hardcoded hostname, port, or localhost fallback exists in source code.
4. **`VITE_AGENT_URL_TEMPLATE`** is validated lazily — only when workspace/agent features are needed. Dashboard and authentication remain usable when it is absent or misconfigured.

Verify with:

```bash
rg -n 'https?://|127\.0\.0\.1|localhost|amazonaws\.com' frontend/src frontend/vite.config.js
```

Expected output: **zero matches.**

## Architecture

```
frontend/src/
├── app/
│   ├── App.jsx           # Auth state machine (checking → dashboard | workspace)
│   └── ThemeContext.jsx  # Light/dark theme (localStorage → matchMedia → HTML class)
├── lib/
│   ├── config/env.js     # VITE_AGENT_URL_TEMPLATE handling
│   └── api/
│       ├── projects.js   # GET/POST /api/sandbox/project, POST /api/sandbox/start
│       ├── agent.js      # Per-sandbox file ops (via VITE_AGENT_URL_TEMPLATE)
│       ├── ai.js         # SSE streaming POST /api/ai/invoke
│       └── terminal.js   # Socket.IO to sandbox agent
├── features/
│   ├── auth/WelcomePage.jsx
│   ├── projects/         # Dashboard, ProjectCard, NewProjectModal, useProjects
│   ├── workspace/        # WorkspacePage, WorkspaceHeader, WorkspaceLayout
│   ├── files/            # FilesPanel, MonacoEditor, useFiles
│   ├── ai/               # ChatPanel, ChatMessage, ChatInput, useAiChat
│   ├── preview/          # PreviewPanel
│   └── terminal/         # TerminalPanel, useTerminal
├── components/ui/        # Button, Modal, Spinner, StatusBadge, ThemeToggle, PanelHeader
└── styles/
    ├── tokens.css        # Design token CSS custom properties (dark + light)
    └── animations.css    # Keyframe animations and utility classes
```

## Theme system

1. On first load, reads `localStorage.getItem("craftly-theme")`.
2. If absent, checks `window.matchMedia("(prefers-color-scheme: dark)")`.
3. Applies `light` or `dark` class to `<html>` via JavaScript (not CSS media queries).
4. User toggle persists to localStorage.

## Backend API contract

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/sandbox/project` | GET | Auth check + project list (401 = unauthenticated) |
| `/api/sandbox/project` | POST | Create project `{ title }` |
| `/api/sandbox/start` | POST | Start sandbox `{ projectId }` → `{ sandboxId, previewUrl }` |
| `/api/auth/google` | GET | OAuth redirect (navigation, not fetch) |
| `{agentUrl}/list-files` | GET | List sandbox files |
| `{agentUrl}/read-files` | GET | Read file content |
| `{agentUrl}/update-files` | PATCH | Save file content |
| `{agentUrl}/create-files` | POST | Create new file |
| `{agentUrl}/delete-files` | DELETE | Delete files |
| `/api/ai/invoke` | POST | Start AI SSE stream |
| `{agentUrl}` | Socket.IO | Terminal PTY |

All first-party requests include `credentials: "include"`.

## ⚠️ Deployment limitation

> **The current backend router only recognizes `*.preview.localhost` and `*.agent.localhost` wildcard patterns.**
>
> This works fine for local development. **AWS or any cloud deployment will need matching router/ingress work outside the frontend scope**, such as:
> - A wildcard DNS record for `*.preview.<your-domain>` and `*.agent.<your-domain>`
> - An ingress controller rule to route these subdomains to the appropriate sandbox containers
> - `VITE_AGENT_URL_TEMPLATE` updated to match the production pattern, e.g. `https://{sandboxId}.agent.example.com`
>
> This is a backend/infrastructure task and is not in scope for the frontend. The frontend only reads `VITE_AGENT_URL_TEMPLATE` and never constructs absolute URLs.
