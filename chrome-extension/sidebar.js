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
			// Try to get the URL from the content script
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				if (tabs[0]?.id) {
					chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_URL' }, (response) => {
						this.currentUrl = response?.url || '';
						this.prInfo = this.extractPRInfoFromUrl(this.currentUrl);
						resolve();
					});
				} else {
					this.currentUrl = '';
					this.prInfo = null;
					resolve();
				}
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
		this.addMessage('assistant', 'Composing...');
		this.render();

		if (!this.prInfo) {
			this.addMessage(
				'assistant',
				'Could not detect PR info from the current page URL. Please open a GitHub PR page.',
			);
			this.loading = false;
			this.render();
			return;
		}
		const { owner, repo, prNumber } = this.prInfo;
		console.log('PR Summary API call:', owner, repo, prNumber);
		try {
			const res = await fetch(`http://localhost:8000/pr-summary/${owner}/${repo}/${prNumber}`);
			const data = await res.json();
			console.log('PR Summary API response:', data);
			// Remove all 'Model is thinking...' messages
			this.chat = this.chat.filter((m) => m.text !== 'Model is thinking...');
			this.addMessage('assistant', data.message || 'No summary.');
		} catch (error) {
			this.chat = this.chat.filter((m) => m.text !== 'Model is thinking...');
			this.addMessage('assistant', 'Error: ' + error.message);
		}

		this.loading = false;
		this.render();
	}

	async handleSuggestion(action) {
		this.loading = true;
		this.addMessage('user', action);
		this.addMessage('assistant', 'Composing...');
		this.render();

		if (!this.prInfo) {
			this.addMessage(
				'assistant',
				'Could not detect repo info from the current page URL. Please open a GitHub PR or repo page.',
			);
			this.loading = false;
			this.render();
			return;
		}
		const { owner, repo } = this.prInfo;
		console.log('Inactive Items API call:', owner, repo);
		try {
			const res = await fetch(`http://localhost:8000/inactive-items/${owner}/${repo}`);
			const data = await res.json();
			console.log('Inactive Items API response:', data);
			// Remove all 'Model is thinking...' messages
			this.chat = this.chat.filter((m) => m.text !== 'Model is thinking...');
			if (
				(Array.isArray(data.pull_requests) && data.pull_requests.length) ||
				(Array.isArray(data.issues) && data.issues.length)
			) {
				let msg = '';
				if (Array.isArray(data.pull_requests) && data.pull_requests.length) {
					msg += `Inactive PRs (${data.pull_requests.length}):\n`;
					data.pull_requests.forEach((pr) => {
						console.log('PR:', pr, 'number:', pr.number, 'title:', pr.title);
						msg += `- #${String(pr.number)}: ${String(pr.title)} (idle ${String(
							pr.daysIdle || pr.DaysIdle || '?',
						)} days)\n`;
					});
				}
				if (Array.isArray(data.issues) && data.issues.length) {
					msg += `Inactive Issues (${data.issues.length}):\n`;
					data.issues.forEach((issue) => {
						console.log('Issue:', issue, 'number:', issue.number, 'title:', issue.title);
						msg += `- #${String(issue.number)}: ${String(issue.title)} (idle ${String(
							issue.daysIdle || issue.DaysIdle || '?',
						)} days)\n`;
					});
				}
				this.addMessage('assistant', msg);
			} else {
				this.addMessage('assistant', 'No inactive PRs or issues found.');
			}
		} catch (error) {
			this.chat = this.chat.filter((m) => m.text !== 'Model is thinking...');
			this.addMessage('assistant', 'Error: ' + error.message);
		}

		this.loading = false;
		this.render();
	}

	async handleQuery(query) {
		this.loading = true;
		this.addMessage('user', query);
		this.addMessage('assistant', 'Composing...');
		this.render();

		try {
			const res = await fetch('http://localhost:8000/query', {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain',
				},
				body: query,
			});
			const data = await res.json();
			console.log('Query API response:', data.message);
			// Remove all 'Model is thinking...' messages
			this.chat = this.chat.filter((m) => m.text !== 'Model is thinking...');
			this.addMessage('assistant', data.message || 'No result.');
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
			// Scroll chat to bottom
			const chatContainer = document.querySelector('.chat-container');
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}
	}
}

// Initialize the app
const app = new SidebarApp();
