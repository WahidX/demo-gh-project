// sidebar.js - Vanilla JavaScript version
class SidebarApp {
	constructor() {
		this.token = '';
		this.chat = [];
		this.loading = false;
		this.currentUrl = '';
		this.prInfo = null;
		this.suggestions = [{ label: 'Scan for inactive issues/PRs', action: 'inactive-items' }];

		this.init();
	}

	async init() {
		await this.loadToken();
		await this.getCurrentUrl();
		this.render();
	}

	async loadToken() {
		return new Promise((resolve) => {
			chrome.storage.local.get(['gh_token'], (result) => {
				this.token = result.gh_token || '';
				resolve();
			});
		});
	}

	async getCurrentUrl() {
		return new Promise((resolve) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				this.currentUrl = tabs[0]?.url || '';
				this.prInfo = this.extractPRInfoFromUrl(this.currentUrl);
				resolve();
			});
		});
	}

	extractPRInfoFromUrl(url) {
		const m = url.match(/github.com\/(.+?)\/(.+?)\/pull\/(\d+)/);
		if (m) {
			return { owner: m[1], repo: m[2], prNumber: m[3] };
		}
		return null;
	}

	saveToken(token) {
		return new Promise((resolve) => {
			chrome.storage.local.set({ gh_token: token }, () => {
				this.token = token;
				resolve();
			});
		});
	}

	clearToken() {
		return new Promise((resolve) => {
			chrome.storage.local.remove(['gh_token'], () => {
				console.log('Token removed from chrome.storage.local');
				this.token = '';
				this.chat = [];
				resolve();
			});
		});
	}

	async handleTokenSave(inputValue) {
		await this.saveToken(inputValue);
		this.render();
	}

	async handleLogout() {
		console.log('Logout button clicked');
		await this.clearToken();
		console.log('Token after clearToken:', this.token);
		this.render();
	}

	async handlePRSummary() {
		this.loading = true;
		this.addMessage('user', 'Generate PR summary');
		this.render();

		if (!this.prInfo) return;

		const { owner, repo, prNumber } = this.prInfo;
		try {
			const res = await fetch('http://localhost:8080/summarize-pr', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.token}`,
				},
				body: JSON.stringify({ owner, repo, prNumber }),
			});
			const data = await res.json();
			this.addMessage('assistant', data.summary || 'No summary.');
		} catch (error) {
			this.addMessage('assistant', 'Error: ' + error.message);
		}

		this.loading = false;
		this.render();
	}

	async handleSuggestion(action) {
		this.loading = true;
		this.addMessage('user', action);
		this.render();

		try {
			const res = await fetch(`http://localhost:8080/${action}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.token}`,
				},
				body: JSON.stringify({}),
			});
			const data = await res.json();
			this.addMessage('assistant', data.result || 'No result.');
		} catch (error) {
			this.addMessage('assistant', 'Error: ' + error.message);
		}

		this.loading = false;
		this.render();
	}

	async handleQuery(query) {
		this.loading = true;
		this.addMessage('user', query);
		this.render();

		try {
			const res = await fetch('http://localhost:8080/query', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.token}`,
				},
				body: JSON.stringify({ query }),
			});
			const data = await res.json();
			this.addMessage('assistant', data.result || 'No result.');
		} catch (error) {
			this.addMessage('assistant', 'Error: ' + error.message);
		}

		this.loading = false;
		this.render();
	}

	addMessage(role, text) {
		this.chat.push({ role, text });
	}

	renderLogin() {
		return `
				<div class="login-container">
					<h2 class="title">GitHub PR Summarizer</h2>
					<input type="password" id="tokenInput" class="input" placeholder="Enter GitHub token">
					<button id="loginBtn" class="button">Login</button>
				</div>
			`;
	}

	renderMain() {
		return `
				<div class="header">
					<span style="font-weight: 600;">Token saved</span>
					<button id="logoutBtn" class="logout-btn">Logout</button>
				</div>
				${
					this.prInfo
						? `
					<button id="prSummaryBtn" ${this.loading ? 'disabled' : ''} class="pr-summary-btn">
						${this.loading ? 'Loading...' : 'Generate PR summary'}
					</button>
				`
						: ''
				}
				<div class="chat-container">
					${this.chat
						.map(
							(msg) => `
						<div class="message ${msg.role}">${msg.text}</div>
					`,
						)
						.join('')}
				</div>
				<div class="suggestions">
					${this.suggestions
						.map(
							(s, i) => `
						<button class="suggestion-btn" data-action="${s.action}" data-idx="${i}">${s.label}</button>
					`,
						)
						.join('')}
				</div>
				<form id="queryForm" class="query-form">
					<input type="text" id="queryInput" class="query-input" placeholder="Ask anything... (e.g. scan repo)">
					<button type="submit" class="button" style="width: auto;">Send</button>
				</form>
			`;
	}

	render() {
		const app = document.getElementById('app');
		if (!this.token) {
			app.innerHTML = this.renderLogin();
			// Add event listener for login
			const loginBtn = document.getElementById('loginBtn');
			if (loginBtn) {
				loginBtn.addEventListener('click', () => {
					const inputValue = document.getElementById('tokenInput').value;
					this.handleTokenSave(inputValue);
				});
			}
		} else {
			app.innerHTML = this.renderMain();
			// Add event listener for logout
			const logoutBtn = document.getElementById('logoutBtn');
			if (logoutBtn) {
				logoutBtn.addEventListener('click', () => this.handleLogout());
			}
			// Add event listener for PR summary
			const prSummaryBtn = document.getElementById('prSummaryBtn');
			if (prSummaryBtn) {
				prSummaryBtn.addEventListener('click', () => this.handlePRSummary());
			}
			// Add event listeners for suggestions
			const suggestionBtns = document.querySelectorAll('.suggestion-btn');
			suggestionBtns.forEach((btn) => {
				btn.addEventListener('click', (e) => {
					const action = btn.getAttribute('data-action');
					this.handleSuggestion(action);
				});
			});
			// Add event listener for query form
			const queryForm = document.getElementById('queryForm');
			if (queryForm) {
				queryForm.addEventListener('submit', (e) => {
					e.preventDefault();
					const queryInput = document.getElementById('queryInput');
					this.handleQuery(queryInput.value);
					queryInput.value = '';
				});
			}
		}
	}
}

// Initialize the app
const app = new SidebarApp();
