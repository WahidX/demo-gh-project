// Check
const e = React.createElement;

function useChromeStorage(key, initialValue) {
  const [value, setValue] = React.useState(initialValue);
  React.useEffect(() => {
    chrome.storage.local.get([key], (result) => {
      if (result[key] !== undefined) setValue(result[key]);
    });
  }, [key]);
  const save = (val) => {
    chrome.storage.local.set({ [key]: val }, () => setValue(val));
  };
  const clear = () => {
    chrome.storage.local.remove([key], () => setValue(undefined));
  };
  return [value, save, clear];
}

function extractPRInfoFromUrl(url) {
  // e.g. https://github.com/owner/repo/pull/123
  const m = url.match(/github.com\/(.+?)\/(.+?)\/pull\/(\d+)/);
  if (m) {
    return { owner: m[1], repo: m[2], prNumber: m[3] };
  }
  return null;
}

function isPRPage(url) {
  return /github.com\/.+\/.+\/pull\/[0-9]+/.test(url);
}

function Sidebar() {
  const [token, saveToken, clearToken] = useChromeStorage('gh_token', '');
  const [input, setInput] = React.useState('');
  const [chat, setChat] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [url] = React.useState(window.location.href);
  const [prInfo] = React.useState(extractPRInfoFromUrl(window.location.href));
  const [suggestions] = React.useState([
    { label: 'Scan for inactive issues/PRs', action: 'inactive-items' },
  ]);

  const handleTokenSave = () => {
    saveToken(input);
    setInput('');
  };

  const handleLogout = () => {
    clearToken();
    setChat([]);
  };

  const handlePRSummary = async () => {
    setLoading(true);
    setChat((c) => [...c, { role: 'user', text: 'Generate PR summary' }]);
    if (!prInfo) return;
    const { owner, repo, prNumber } = prInfo;
    const res = await fetch('http://localhost:8080/summarize-pr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ owner, repo, prNumber }),
    });
    const data = await res.json();
    setChat((c) => [...c, { role: 'assistant', text: data.summary || 'No summary.' }]);
    setLoading(false);
  };

  const handleSuggestion = async (action) => {
    setLoading(true);
    setChat((c) => [...c, { role: 'user', text: action }]);
    const res = await fetch(`http://localhost:8080/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setChat((c) => [...c, { role: 'assistant', text: data.result || 'No result.' }]);
    setLoading(false);
  };

  const handleQuery = async (query) => {
    setLoading(true);
    setChat((c) => [...c, { role: 'user', text: query }]);
    const res = await fetch('http://localhost:8080/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setChat((c) => [...c, { role: 'assistant', text: data.result || 'No result.' }]);
    setLoading(false);
  };

  // If no token, show only the login input
  if (!token) {
    return e('div', { style: { background: '#fff', color: '#111', minHeight: 500, padding: 16, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' } },
      e('input', {
        type: 'password',
        placeholder: 'Enter GitHub token',
        value: input,
        onChange: (e) => setInput(e.target.value),
        style: { padding: 8, width: '80%', border: '1px solid #ccc', borderRadius: 4, marginBottom: 12 }
      }),
      e('button', { onClick: handleTokenSave, style: { padding: 8, background: '#111', color: '#fff', border: 'none', borderRadius: 4, width: '80%' } }, 'Login')
    );
  }

  return e('div', { style: { background: '#fff', color: '#111', minHeight: 500, padding: 16, fontFamily: 'Inter, sans-serif' } },
    e('div', { style: { marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      e('span', { style: { fontWeight: 600 } }, 'Token saved'),
      e('button', { onClick: handleLogout, style: { padding: 8, background: '#eee', color: '#111', border: 'none', borderRadius: 4 } }, 'Logout')
    ),
    prInfo && token && e('button', {
      onClick: handlePRSummary,
      disabled: loading,
      style: { width: '100%', padding: 12, background: '#111', color: '#fff', border: 'none', borderRadius: 4, marginBottom: 16 }
    }, loading ? 'Loading...' : 'Generate PR summary'),
    e('div', { style: { background: '#f7f7f7', borderRadius: 8, padding: 12, minHeight: 200, marginBottom: 16, maxHeight: 250, overflowY: 'auto' } },
      chat.map((msg, i) => e('div', {
        key: i,
        style: {
          textAlign: msg.role === 'user' ? 'right' : 'left',
          margin: '8px 0',
          color: msg.role === 'user' ? '#222' : '#444',
          background: msg.role === 'user' ? '#eaeaea' : '#fff',
          borderRadius: 6,
          padding: 8,
          maxWidth: '80%',
          marginLeft: msg.role === 'user' ? '20%' : 0,
          marginRight: msg.role === 'user' ? 0 : '20%'
        }
      }, msg.text))
    ),
    token && e('div', { style: { display: 'flex', gap: 8, marginBottom: 16 } },
      suggestions.map((s, i) => e('button', {
        key: i,
        onClick: () => handleSuggestion(s.action),
        style: { padding: 8, background: '#fff', color: '#111', border: '1px solid #ccc', borderRadius: 4, flex: 1 }
      }, s.label))
    ),
    token && e('form', {
      onSubmit: (ev) => {
        ev.preventDefault();
        const q = ev.target.query.value.trim();
        if (q) handleQuery(q);
        ev.target.query.value = '';
      },
      style: { display: 'flex', gap: 8 }
    },
      e('input', {
        name: 'query',
        type: 'text',
        placeholder: 'Ask anything... (e.g. scan repo)',
        style: { flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }
      }),
      e('button', { type: 'submit', style: { padding: 8, background: '#111', color: '#fff', border: 'none', borderRadius: 4 } }, 'Send')
    )
  );
}

// Only inject sidebar if on a PR page and not already present
if (isPRPage(window.location.href) && !document.getElementById('ghp-copilot-sidebar')) {
  const sidebar = document.createElement('div');
  sidebar.id = 'ghp-copilot-sidebar';
  sidebar.style.position = 'fixed';
  sidebar.style.top = '0';
  sidebar.style.right = '0';
  sidebar.style.width = '400px';
  sidebar.style.height = '100vh';
  sidebar.style.background = '#fff';
  sidebar.style.zIndex = '999999';
  sidebar.style.boxShadow = '-2px 0 8px rgba(0,0,0,0.08)';
  sidebar.style.borderLeft = '1px solid #eee';
  sidebar.style.display = 'flex';
  sidebar.style.flexDirection = 'column';
  sidebar.style.overflow = 'auto';
  document.body.appendChild(sidebar);
  const root = document.createElement('div');
  root.id = 'ghp-copilot-sidebar-root';
  sidebar.appendChild(root);
  ReactDOM.render(e(Sidebar), root);
}

// content.js
if (window.location.hostname === 'github.com' && /\/pull\/[0-9]+/.test(window.location.pathname)) {
  // Send message to service worker to open the side panel
  chrome.runtime.sendMessage({ action: 'openSidePanel' });
}
