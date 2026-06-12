// Thin fetch wrapper around the Express API.
// Defaults to the same-origin relative path `/api`, which is reverse-proxied
// to the backend by nginx (production) or the Vite dev server (development).
// This keeps the app working behind any host (localhost, Docker, Codespaces)
// without baking an absolute backend URL into the build.
const API_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'mcp_rag_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // Surface a consistent shape for offline / unreachable API.
    const err = new Error('Network error: unable to reach the API');
    err.cause = networkErr;
    throw err;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  profile: () => request('/profile'),
  documents: () => request('/documents'),
  analysis: () => request('/analysis'),
};

export default api;
