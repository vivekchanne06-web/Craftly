import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for this mode (so we can read VITE_DEV_PROXY_TARGET)
  const env = loadEnv(mode, __dirname, '')

  // The proxy target MUST come from the environment.
  // If VITE_DEV_PROXY_TARGET is not set in development mode, log a clear warning.
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET
  if (mode === 'development' && !devProxyTarget) {
    console.warn(
      '\n⚠️  [Craftly] VITE_DEV_PROXY_TARGET is not set.\n' +
      '   /api/* requests will not be proxied. Set this in your local environment file.\n'
    )
  }

  // Parse the dev proxy target URL so we can re-use its hostname/port.
  let proxyHost = '127.0.0.1'
  let proxyPort = 8080
  if (devProxyTarget) {
    try {
      const u = new URL(devProxyTarget)
      proxyHost = u.hostname
      proxyPort = parseInt(u.port || '80', 10)
    } catch { /* keep defaults */ }
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      hmr: {
        clientPort: 5173,
      },
      proxy: devProxyTarget
        ? {
            '/api': {
              target: devProxyTarget,
              changeOrigin: true,
              secure: false,
              configure: (proxy) => {
                proxy.on('error', (err) => console.log('[proxy] error', err.message))
                proxy.on('proxyReq', (_, req) =>
                  console.log('[proxy] →', req.method, req.url)
                )
                proxy.on('proxyRes', (res, req) =>
                  console.log('[proxy] ←', res.statusCode, req.url)
                )
              },
            },

            // ─── Agent proxy (/sandbox-agent/<sandboxId>/...) ───────────────
            //
            // Windows doesn't resolve *.localhost wildcard subdomains, so the
            // browser can't reach <sandboxId>.agent.localhost:8080 directly.
            //
            // Strategy:
            //   1. The frontend calls relative URLs: /sandbox-agent/<id>/list-files
            //   2. The Vite dev server receives the request.
            //   3. The `bypass` hook runs BEFORE the path rewrite, so we can
            //      read the original URL, extract the sandboxId, and stash it
            //      on the req object.
            //   4. The rewrite strips the /sandbox-agent/<id> prefix.
            //   5. The `configure` proxyReq handler reads the stashed sandboxId
            //      and injects the Host header that the ingress-nginx router needs.
            //
            '/sandbox-agent': {
              target: devProxyTarget,
              changeOrigin: false,
              secure: false,
              ws: true,
              rewrite: (path) => path.replace(/^\/sandbox-agent\/[^/]+/, '') || '/',
              bypass: (req) => {
                // Stash sandboxId on req before the rewrite runs.
                // bypass() returning undefined means "proceed with proxy".
                const match = req.url?.match(/^\/sandbox-agent\/([^/]+)/)
                if (match) req._craftlySandboxId = match[1]
                return undefined
              },
              configure: (proxy) => {
                proxy.on('error', (err) =>
                  console.log('[agent-proxy] error', err.message)
                )
                // HTTP requests — path has been rewritten; sandboxId is on req._craftlySandboxId
                proxy.on('proxyReq', (proxyReq, req) => {
                  const sandboxId = req._craftlySandboxId
                  if (sandboxId) {
                    proxyReq.setHeader('Host', `${sandboxId}.agent.localhost:${proxyPort}`)
                    console.log('[agent-proxy] HTTP →', req.method, req.url, '| sandbox:', sandboxId)
                  }
                })
                // WebSocket upgrades (Socket.IO terminal)
                // Vite does NOT run bypass() for WS upgrades, so req._craftlySandboxId
                // isn't set here. Instead, the Socket.IO client sends x-sandbox-id as
                // an extraHeader, which is present on the incoming upgrade request.
                proxy.on('proxyReqWs', (proxyReq, req) => {
                  const sandboxId = req.headers['x-sandbox-id'] || req._craftlySandboxId
                  if (sandboxId) {
                    proxyReq.setHeader('Host', `${sandboxId}.agent.localhost:${proxyPort}`)
                    console.log('[agent-proxy] WS →', req.url, '| sandbox:', sandboxId)
                  }
                })
                proxy.on('proxyRes', (res, req) =>
                  console.log('[agent-proxy] ←', res.statusCode, req.url)
                )
              },
            },
          }
        : undefined,
    },
  }
})
