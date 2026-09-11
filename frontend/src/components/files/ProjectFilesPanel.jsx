import { useCallback, useEffect, useState } from 'react';
import { PanelHeader } from '../chat/ChatPanel.jsx';
import { getAgentUrl } from '../../config/env.js';

/**
 * ProjectFilesPanel - displays the file tree of the current sandbox project.
 *
 * Calls GET /list-files on the per-sandbox agent via getAgentUrl(sandboxId).
 * Agent response: { files: ['index.html', 'src/main.js', ...] }
 * No fake/hardcoded data - all paths come from the agent at runtime.
 *
 * @param {{ sandbox: { sandboxId: string, previewUrl: string, status: string } }} props
 */
export default function ProjectFilesPanel({
  sandbox = {},
  selectedFile = null,
  onSelectFile = () => {},
}) {
  const sandboxId = sandbox?.sandboxId;
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState(null);

  const doFetch = useCallback(async (signal) => {
    if (!sandboxId) {
      setFiles([]);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    setErrorMsg(null);
    try {
      const agentUrl = getAgentUrl(sandboxId);
      const res = await fetch(`${agentUrl}/list-files`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!res.ok) throw new Error(`Agent responded with HTTP ${res.status}`);
      const data = await res.json();
      const rawFiles = Array.isArray(data.files) ? data.files : [];
      setFiles(rawFiles.map((f) => f.replace(/\\/g, '/')));
      setStatus('ready');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setErrorMsg(err.message || 'Failed to load files.');
      setStatus('error');
    }
  }, [sandboxId]);

  const fetchFiles = useCallback(() => { doFetch(undefined); }, [doFetch]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    doFetch(controller.signal);
    return () => controller.abort();
  }, [doFetch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--color-surface)' }}>
      <PanelHeader
        icon={<FolderIcon />}
        label='Project Files'
        extra={
          <button
            id='files-refresh-btn'
            onClick={fetchFiles}
            disabled={status === 'loading' || !sandboxId}
            title='Refresh file list'
            aria-label='Refresh file list'
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 24, height: 24, borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: 'none',
              color: 'var(--color-text-muted)',
              cursor: status === 'loading' || !sandboxId ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' || !sandboxId ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (status !== 'loading' && sandboxId) e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <RefreshIcon spinning={status === 'loading'} />
          </button>
        }
      />

      {!sandboxId && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
          No active sandbox session.
        </div>
      )}

      {sandboxId && status === 'loading' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', color: 'var(--color-text-muted)' }}>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='var(--color-accent)'
            strokeWidth='2' strokeLinecap='round' aria-hidden='true' style={{ animation: 'spin 0.8s linear infinite' }}>
            <path d='M21 12a9 9 0 1 1-6.219-8.56' />
          </svg>
          <span style={{ fontSize: '0.75rem' }}>Loading files...</span>
        </div>
      )}

      {sandboxId && status === 'error' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', textAlign: 'center' }}>
          <span style={{ fontSize: '1.25rem', color: 'var(--color-error)' }}>!</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-error)', lineHeight: 1.5, maxWidth: 200 }}>{errorMsg}</p>
          <button id='files-retry-btn' onClick={fetchFiles}
            style={{ fontSize: '0.75rem', color: 'var(--color-accent)', background: 'transparent', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {sandboxId && status === 'ready' && (
        <FileTree
          files={files}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
        />
      )}
    </div>
  );
}

function buildTree(paths) {
  const root = {};
  for (const filePath of paths) {
    const parts = filePath.split('/');
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        node[part] = null;
      } else {
        if (!node[part] || node[part] === null) node[part] = {};
        node = node[part];
      }
    }
  }
  return root;
}

function FileTree({ files, selectedFile, onSelectFile }) {
  if (files.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
        <FolderIcon size={28} />
        <span>No files found</span>
      </div>
    );
  }
  const tree = buildTree(files);
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 'var(--space-2) 0' }}>
      <TreeNode
        name='/'
        node={tree}
        depth={0}
        defaultOpen
        pathPrefix=''
        selectedFile={selectedFile}
        onSelectFile={onSelectFile}
      />
    </div>
  );
}

function TreeNode({
  name,
  node,
  depth,
  defaultOpen = false,
  pathPrefix = '',
  selectedFile,
  onSelectFile,
}) {
  const isDir = node !== null && typeof node === 'object';
  const [open, setOpen] = useState(defaultOpen);
  const indent = depth * 12 + 8;
  const isRoot = name === '/' && depth === 0;
  const fullPath = isRoot ? '' : (pathPrefix ? `${pathPrefix}/${name}` : name);
  const isSelected = !isDir && selectedFile === fullPath;

  if (!isDir) {
    return (
      <div
        id={`file-node-${fullPath.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
        title={fullPath}
        onClick={() => onSelectFile?.(fullPath)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: indent,
          paddingRight: 8,
          paddingTop: 3,
          paddingBottom: 3,
          cursor: 'pointer',
          fontSize: '0.75rem',
          color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
          background: isSelected ? 'var(--color-surface-2)' : 'transparent',
          fontWeight: isSelected ? 600 : 400,
          borderLeft: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent',
          borderRadius: 'var(--radius-sm)',
          margin: '0 4px',
          userSelect: 'none',
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'var(--color-surface-2)';
            e.currentTarget.style.color = 'var(--color-text)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }
        }}
      >
        <FileIcon name={name} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
          {name}
        </span>
      </div>
    );
  }

  const sortedKeys = Object.keys(node).sort((a, b) => {
    const aIsDir = node[a] !== null;
    const bIsDir = node[b] !== null;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  if (isRoot) {
    return (
      <>
        {sortedKeys.map((key) => (
          <TreeNode
            key={key}
            name={key}
            node={node[key]}
            depth={depth}
            defaultOpen={depth < 1}
            pathPrefix=''
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        ))}
      </>
    );
  }

  return (
    <div>
      <div
        onClick={() => setOpen((o) => !o)}
        title={fullPath}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          paddingLeft: indent,
          paddingRight: 8,
          paddingTop: 3,
          paddingBottom: 3,
          cursor: 'pointer',
          fontSize: '0.75rem',
          color: 'var(--color-text)',
          fontWeight: 500,
          borderRadius: 'var(--radius-sm)',
          margin: '0 4px',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <ChevronIcon open={open} />
        <FolderIcon open={open} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
          {name}
        </span>
      </div>
      {open &&
        sortedKeys.map((key) => (
          <TreeNode
            key={key}
            name={key}
            node={node[key]}
            depth={depth + 1}
            defaultOpen={false}
            pathPrefix={fullPath}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        ))}
    </div>
  );
}

function FolderIcon({ size = 14, open = false }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none'
      stroke={open ? 'var(--color-accent)' : 'var(--color-text-muted)'}
      strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'
      aria-hidden='true' style={{ flexShrink: 0 }}>
      <path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' />
    </svg>
  );
}

function FileIcon({ name }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const colorMap = {
    js: '#f7df1e', jsx: '#61dafb', ts: '#3178c6', tsx: '#61dafb',
    html: '#e44d26', css: '#264de4', json: '#cbcb41', md: '#519aba',
    py: '#3572a5', sh: '#89e051', yml: '#cb171e', yaml: '#cb171e', env: '#ffb13b',
  };
  const color = colorMap[ext] || 'var(--color-text-subtle)';
  return (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none'
      stroke={color} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'
      aria-hidden='true' style={{ flexShrink: 0 }}>
      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
      <polyline points='14 2 14 8 20 8' />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width='10' height='10' viewBox='0 0 24 24' fill='none'
      stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'
      aria-hidden='true' style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>
      <polyline points='9 18 15 12 9 6' />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none'
      stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'
      aria-hidden='true' style={spinning ? { animation: 'spin 0.8s linear infinite' } : undefined}>
      <polyline points='23 4 23 10 17 10' />
      <path d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10' />
    </svg>
  );
}