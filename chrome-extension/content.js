// Listen for requests from the sidebar to get the current page URL
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === 'GET_PAGE_URL') {
		sendResponse({ url: window.location.href });
	}
});
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

// If no token, show only the login input
if (!token) {
	return e(
		'div',
		{
			style: {
				background: '#fff',
				color: '#111',
				minHeight: 500,
				padding: 16,
				fontFamily: 'Inter, sans-serif',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
			},
		},
		e('input', {
			type: 'password',
			placeholder: 'Enter GitHub token',
			value: input,
			onChange: (e) => setInput(e.target.value),
			style: {
				padding: 8,
				width: '80%',
				border: '1px solid #ccc',
				borderRadius: 4,
				marginBottom: 12,
			},
		}),
		e(
			'button',
			{
				onClick: handleTokenSave,
				style: {
					padding: 8,
					background: '#111',
					color: '#fff',
					border: 'none',
					borderRadius: 4,
					width: '80%',
				},
			},
			'Login',
		),
	);
}

return e(
	'div',
	{
		style: {
			background: '#fff',
			color: '#111',
			minHeight: 500,
			padding: 16,
			fontFamily: 'Inter, sans-serif',
		},
	},
	e(
		'div',
		{
			style: {
				marginBottom: 16,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
			},
		},
		e('span', { style: { fontWeight: 600 } }, 'Token saved'),
		e(
			'button',
			{
				onClick: handleLogout,
				style: { padding: 8, background: '#eee', color: '#111', border: 'none', borderRadius: 4 },
			},
			'Logout',
		),
	),
	prInfo &&
		token &&
		e(
			'button',
			{
				onClick: handlePRSummary,
				disabled: loading,
				style: {
					width: '100%',
					padding: 12,
					background: '#111',
					color: '#fff',
					border: 'none',
					borderRadius: 4,
					marginBottom: 16,
				},
			},
			loading ? 'Loading...' : 'Generate PR summary',
		),
	e(
		'div',
		{
			style: {
				background: '#f7f7f7',
				borderRadius: 8,
				padding: 12,
				minHeight: 200,
				marginBottom: 16,
				maxHeight: 250,
				overflowY: 'auto',
			},
		},
		chat.map((msg, i) =>
			e(
				'div',
				{
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
						marginRight: msg.role === 'user' ? 0 : '20%',
					},
				},
				msg.text,
			),
		),
	),
	token &&
		e(
			'div',
			{ style: { display: 'flex', gap: 8, marginBottom: 16 } },
			suggestions.map((s, i) =>
				e(
					'button',
					{
						key: i,
						onClick: () => handleSuggestion(s.action),
						style: {
							padding: 8,
							background: '#fff',
							color: '#111',
							border: '1px solid #ccc',
							borderRadius: 4,
							flex: 1,
						},
					},
					s.label,
				),
			),
		),
	token &&
		e(
			'form',
			{
				onSubmit: (ev) => {
					ev.preventDefault();
					const q = ev.target.query.value.trim();
					if (q) handleQuery(q);
					ev.target.query.value = '';
				},
				style: { display: 'flex', gap: 8 },
			},
			e('input', {
				name: 'query',
				type: 'text',
				placeholder: 'Ask anything... (e.g. scan repo)',
				style: { flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 },
			}),
			e(
				'button',
				{
					type: 'submit',
					style: { padding: 8, background: '#111', color: '#fff', border: 'none', borderRadius: 4 },
				},
				'Send',
			),
		),
);

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
