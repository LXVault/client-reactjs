// Thin fetch wrapper around the Express API.
// VITE_API_URL is just the backend ORIGIN (e.g. https://api.example.com); the
// client owns the `/api` path, so the env value never needs the suffix and the
// routing stays a frontend concern. When unset it falls back to a same-origin
// relative base, which the Vite dev server / a same-origin proxy serves.
//
// Tolerant of common variations: a trailing slash, or an accidental `/api`
// suffix, both resolve to the same correct base.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');
const API_URL = `${API_ORIGIN}/api`;

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

// Multipart upload helper. Unlike `request`, we must NOT set Content-Type —
// the browser sets it (with the multipart boundary) from the FormData body.
async function upload(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData });
  } catch (networkErr) {
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
  // Retires every session token this user holds, by bumping token_version
  // server-side. A stateless JWT cannot otherwise be cancelled, so without this
  // call a logged-out token keeps working until it expires on its own.
  logout: () => request('/auth/logout', { method: 'POST' }),
  profile: () => request('/profile'),
  documents: () => request('/documents'),
  analysis: () => request('/analysis'),

  // Projects (documents) & members
  createDocument: (payload) => request('/documents', { method: 'POST', body: payload }),
  getDocument: (id) => request(`/documents/${id}`),
  updateDocument: (id, payload) =>
    request(`/documents/${id}`, { method: 'PUT', body: payload }),
  listMembers: (id) => request(`/documents/${id}/members`),
  addMember: (id, payload) =>
    request(`/documents/${id}/members`, { method: 'POST', body: payload }),
  removeMember: (id, userId) =>
    request(`/documents/${id}/members/${userId}`, { method: 'DELETE' }),

  // Per-project execution tokens (one per user per project)
  listTokens: () => request('/tokens'),
  getProjectToken: (id) => request(`/documents/${id}/token`),
  generateProjectToken: (id, payload) =>
    request(`/documents/${id}/token`, { method: 'POST', body: payload }),
  revokeProjectToken: (id) => request(`/documents/${id}/token`, { method: 'DELETE' }),

  // Per-user OpenRouter API key (encrypted server-side; only status returned)
  getOpenRouterKey: () => request('/me/openrouter-key'),
  setOpenRouterKey: (apiKey) =>
    request('/me/openrouter-key', { method: 'PUT', body: { apiKey } }),
  deleteOpenRouterKey: () => request('/me/openrouter-key', { method: 'DELETE' }),

  // Per-project embedding model (owner/admin can change). Both calls return the
  // selected model plus coverage and the models the project already has vectors
  // for, so changing one never needs a second round trip to know what it cost.
  getEmbeddingModel: (id) => request(`/documents/${id}/embedding-model`),
  setEmbeddingModel: (id, model) =>
    request(`/documents/${id}/embedding-model`, { method: 'PUT', body: { model } }),

  // Embed the chunks that have no vector for the current model. The backend
  // works in batches and reports what is still pending, so the caller repeats
  // until nothing is left rather than waiting on one long request.
  backfillEmbeddings: (id) =>
    request(`/documents/${id}/embeddings/backfill`, { method: 'POST' }),

  // Drop the vectors held for one model. The model id contains a slash, which
  // is a path segment here by design and matches the backend's wildcard route.
  deleteModelEmbeddings: (id, model) =>
    request(`/documents/${id}/embeddings/${model}`, { method: 'DELETE' }),

  // Knowledge-base files (the project's central index). Upload/delete are
  // owner/admin only (enforced server-side); listing is open to any member.
  listFiles: (id) => request(`/documents/${id}/files`),
  uploadFiles: (id, fileList) => {
    const form = new FormData();
    Array.from(fileList).forEach((file) => form.append('files', file));
    return upload(`/documents/${id}/files`, form);
  },
  deleteFile: (id, fileId) =>
    request(`/documents/${id}/files/${fileId}`, { method: 'DELETE' }),
};

export default api;
