const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
const STORAGE_KEYS = ['token', 'user', 'apiBaseUrl'];

const state = {
  token: '',
  user: null,
  apiBaseUrl: DEFAULT_API_BASE_URL,
  currentTab: null,
};

const elements = {
  sessionLabel: document.getElementById('sessionLabel'),
  status: document.getElementById('status'),
  loginView: document.getElementById('loginView'),
  saveView: document.getElementById('saveView'),
  loginForm: document.getElementById('loginForm'),
  saveForm: document.getElementById('saveForm'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  loginButton: document.getElementById('loginButton'),
  saveButton: document.getElementById('saveButton'),
  logoutButton: document.getElementById('logoutButton'),
  tabTitle: document.getElementById('tabTitle'),
  tabUrl: document.getElementById('tabUrl'),
  privateVault: document.getElementById('privateVault'),
  vaultPassword: document.getElementById('vaultPassword'),
  vaultPasswordWrap: document.getElementById('vaultPasswordWrap'),
};

const storageGet = (keys) => chrome.storage.local.get(keys);
const storageSet = (items) => chrome.storage.local.set(items);
const storageRemove = (keys) => chrome.storage.local.remove(keys);

const setBusy = (button, isBusy, text) => {
  button.disabled = isBusy;
  if (text) {
    button.dataset.idleText ||= button.textContent;
    button.textContent = isBusy ? text : button.dataset.idleText;
  }
};

const showStatus = (message, type = 'info') => {
  elements.status.textContent = message;
  elements.status.className = `status ${type}`;
  elements.status.hidden = false;
};

const clearStatus = () => {
  elements.status.hidden = true;
  elements.status.textContent = '';
  elements.status.className = 'status';
};

const normalizeUrl = (value) => {
  try {
    const url = new URL(value);
    url.hash = '';
    if (url.pathname.endsWith('/') && url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }
    return url.toString().toLowerCase();
  } catch {
    return value.trim().replace(/\/+$/, '').toLowerCase();
  }
};

const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${state.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...options.headers,
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || data?.message || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
};

const getCurrentTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
};

const renderAuthState = async () => {
  clearStatus();
  elements.loginView.hidden = Boolean(state.token);
  elements.saveView.hidden = !state.token;

  if (!state.token) {
    elements.sessionLabel.textContent = 'Log in to save links';
    return;
  }

  elements.sessionLabel.textContent = state.user?.email || 'Ready to save';
  state.currentTab = await getCurrentTab();

  if (!state.currentTab?.url || state.currentTab.url.startsWith('chrome://')) {
    elements.tabTitle.textContent = 'This tab cannot be saved';
    elements.tabUrl.textContent = state.currentTab?.url || 'No active tab found';
    elements.saveButton.disabled = true;
    showStatus('Open a regular web page before saving.', 'warning');
    return;
  }

  elements.tabTitle.textContent = state.currentTab.title || 'Untitled page';
  elements.tabUrl.textContent = state.currentTab.url;
  elements.saveButton.disabled = false;
};

const handleExpiredSession = async () => {
  await storageRemove(['token', 'user']);
  state.token = '';
  state.user = null;
  await renderAuthState();
  showStatus('Session expired. Please log in again.', 'warning');
};

const checkDuplicate = async (url) => {
  const links = await apiFetch('/links');
  const target = normalizeUrl(url);
  return Array.isArray(links) && links.some((link) => normalizeUrl(link.url) === target);
};

const handleLogin = async (event) => {
  event.preventDefault();
  clearStatus();
  setBusy(elements.loginButton, true, 'Logging in...');

  try {
    const payload = {
      email: elements.email.value.trim(),
      password: elements.password.value,
    };
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await storageSet({ token: data.token, user: data.user });
    state.token = data.token;
    state.user = data.user;
    elements.loginForm.reset();
    await renderAuthState();
    showStatus('Logged in successfully.', 'success');
  } catch (error) {
    showStatus(error.message || 'Unable to log in.', 'error');
  } finally {
    setBusy(elements.loginButton, false, 'Log in');
  }
};

const handleSave = async (event) => {
  event.preventDefault();
  clearStatus();

  if (!state.currentTab?.url) {
    showStatus('No active tab URL found.', 'error');
    return;
  }

  if (elements.privateVault.checked && !elements.vaultPassword.value.trim()) {
    showStatus('Vault password is required for private saves.', 'warning');
    elements.vaultPassword.focus();
    return;
  }

  setBusy(elements.saveButton, true, 'Saving...');

  try {
    const duplicate = await checkDuplicate(state.currentTab.url);
    if (duplicate) {
      showStatus('Already Saved', 'warning');
      return;
    }

    const body = {
      title: state.currentTab.title || state.currentTab.url,
      url: state.currentTab.url,
      category: 'By extension',
    };

    const endpoint = elements.privateVault.checked ? '/links/secret' : '/links';
    if (elements.privateVault.checked) {
      body.password = elements.vaultPassword.value.trim();
    }

    await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    showStatus('URL Saved Successfully ✅', 'success');
    elements.vaultPassword.value = '';
  } catch (error) {
    if (error.status === 401) {
      await handleExpiredSession();
      return;
    }
    showStatus(error.message || 'Unable to save URL.', 'error');
  } finally {
    setBusy(elements.saveButton, false, 'Save URL');
  }
};

const handleLogout = async () => {
  await storageRemove(['token', 'user']);
  state.token = '';
  state.user = null;
  await renderAuthState();
};

const initialize = async () => {
  const stored = await storageGet(STORAGE_KEYS);
  state.token = stored.token || '';
  state.user = stored.user || null;
  state.apiBaseUrl = stored.apiBaseUrl || DEFAULT_API_BASE_URL;

  elements.loginForm.addEventListener('submit', handleLogin);
  elements.saveForm.addEventListener('submit', handleSave);
  elements.logoutButton.addEventListener('click', handleLogout);
  elements.privateVault.addEventListener('change', () => {
    elements.vaultPasswordWrap.hidden = !elements.privateVault.checked;
  });

  await renderAuthState();
};

initialize().catch((error) => {
  showStatus(error.message || 'Extension failed to initialize.', 'error');
});
