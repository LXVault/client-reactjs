import type {
  AddMemberPayload,
  AddMemberResponse,
  AnalysisResponse,
  AuthResponse,
  BackfillResponse,
  Credentials,
  DeleteModelEmbeddingsResponse,
  DocumentPayload,
  DocumentResponse,
  DocumentsResponse,
  EmbeddingModelResponse,
  FilesResponse,
  GenerateTokenResponse,
  MembersResponse,
  MessageResponse,
  OpenRouterKeyStatus,
  ProfileResponse,
  ProjectTokenResponse,
  RegisterPayload,
  TokensResponse,
  UpdateDocumentResponse,
  UploadResponse,
} from './types';

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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
}

// The Error every failed call throws. `status` is set when the API answered,
// and absent when it could not be reached at all.
export interface ApiError extends Error {
  status?: number;
}

interface ErrorBody {
  error?: string;
}

// Builds the normalized error a non 2xx response becomes.
function responseError(res: Response, data: unknown): ApiError {
  const message = (data as ErrorBody | null)?.error || `Request failed (${res.status})`;
  const err: ApiError = new Error(message);
  err.status = res.status;
  return err;
}

// The message a caught failure should show. Everything this module throws is
// an Error carrying a readable message; the fallback covers anything else.
export function errorMessage(err: unknown, fallback: string): string {
  return (err instanceof Error && err.message) || fallback;
}

function networkError(cause: unknown): ApiError {
  // Surface a consistent shape for offline / unreachable API.
  return new Error('Network error: unable to reach the API', { cause });
}

// Path segments interpolated into a URL are encoded first. Several of them
// come from a list the server returned rather than from a literal here, and a
// value carrying `/`, `?` or `#` would otherwise change which endpoint the
// request reaches — `/documents/../tokens` is a different route entirely.
const seg = (value: string | number): string => encodeURIComponent(String(value));

// A model id is `{platform}/{model}` — `openai/text-embedding-3-small` — and the
// backend matches it with a wildcard route (`/:id/embeddings/*model`) rather
// than a named parameter. The slash is a path separator here by design, so
// encoding the whole value would turn it into %2F and the route would stop
// matching. Encode the parts, keep the separator.
const modelSeg = (value: string): string => String(value).split('/').map(seg).join('/');

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  { method = 'GET', body, auth = true }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw networkError(networkErr);
  }

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) throw responseError(res, data);
  return data as T;
}

// Multipart upload helper. Unlike `request`, we must NOT set Content-Type —
// the browser sets it (with the multipart boundary) from the FormData body.
async function upload<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData });
  } catch (networkErr) {
    throw networkError(networkErr);
  }

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) throw responseError(res, data);
  return data as T;
}

export const api = {
  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload: Credentials) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: payload, auth: false }),
  // Retires every session token this user holds, by bumping token_version
  // server-side. A stateless JWT cannot otherwise be cancelled, so without this
  // call a logged-out token keeps working until it expires on its own.
  logout: () => request<MessageResponse>('/auth/logout', { method: 'POST' }),
  profile: () => request<ProfileResponse>('/profile'),
  documents: () => request<DocumentsResponse>('/documents'),
  analysis: () => request<AnalysisResponse>('/analysis'),

  // Projects (documents) & members
  createDocument: (payload: DocumentPayload) =>
    request<DocumentResponse>('/documents', { method: 'POST', body: payload }),
  getDocument: (id: string) => request<DocumentResponse>(`/documents/${seg(id)}`),
  updateDocument: (id: string, payload: DocumentPayload) =>
    request<UpdateDocumentResponse>(`/documents/${seg(id)}`, { method: 'PUT', body: payload }),
  listMembers: (id: string) => request<MembersResponse>(`/documents/${seg(id)}/members`),
  addMember: (id: string, payload: AddMemberPayload) =>
    request<AddMemberResponse>(`/documents/${seg(id)}/members`, { method: 'POST', body: payload }),
  removeMember: (id: string, userId: string) =>
    request<MessageResponse>(`/documents/${seg(id)}/members/${seg(userId)}`, { method: 'DELETE' }),

  // Per-project execution tokens (one per user per project)
  listTokens: () => request<TokensResponse>('/tokens'),
  getProjectToken: (id: string) => request<ProjectTokenResponse>(`/documents/${seg(id)}/token`),
  generateProjectToken: (id: string, payload?: Record<string, unknown>) =>
    request<GenerateTokenResponse>(`/documents/${seg(id)}/token`, { method: 'POST', body: payload }),
  revokeProjectToken: (id: string) =>
    request<MessageResponse>(`/documents/${seg(id)}/token`, { method: 'DELETE' }),

  // Per-user OpenRouter API key (encrypted server-side; only status returned)
  getOpenRouterKey: () => request<OpenRouterKeyStatus>('/me/openrouter-key'),
  setOpenRouterKey: (apiKey: string) =>
    request<OpenRouterKeyStatus>('/me/openrouter-key', { method: 'PUT', body: { apiKey } }),
  deleteOpenRouterKey: () => request<MessageResponse>('/me/openrouter-key', { method: 'DELETE' }),

  // Per-project embedding model (owner/admin can change). Both calls return the
  // selected model plus coverage and the models the project already has vectors
  // for, so changing one never needs a second round trip to know what it cost.
  getEmbeddingModel: (id: string) =>
    request<EmbeddingModelResponse>(`/documents/${seg(id)}/embedding-model`),
  setEmbeddingModel: (id: string, model: string) =>
    request<EmbeddingModelResponse>(`/documents/${seg(id)}/embedding-model`, { method: 'PUT', body: { model } }),

  // Embed the chunks that have no vector for the current model. The backend
  // works in batches and reports what is still pending, so the caller repeats
  // until nothing is left rather than waiting on one long request.
  backfillEmbeddings: (id: string) =>
    request<BackfillResponse>(`/documents/${seg(id)}/embeddings/backfill`, { method: 'POST' }),

  // Drop the vectors held for one model. The model id contains a slash, which
  // is a path segment here by design and matches the backend's wildcard route.
  deleteModelEmbeddings: (id: string, model: string) =>
    request<DeleteModelEmbeddingsResponse>(`/documents/${seg(id)}/embeddings/${modelSeg(model)}`, { method: 'DELETE' }),

  // Knowledge-base files (the project's central index). Upload/delete are
  // owner/admin only (enforced server-side); listing is open to any member.
  listFiles: (id: string) => request<FilesResponse>(`/documents/${seg(id)}/files`),
  uploadFiles: (id: string, fileList: FileList | File[]) => {
    const form = new FormData();
    Array.from(fileList).forEach((file) => form.append('files', file));
    return upload<UploadResponse>(`/documents/${seg(id)}/files`, form);
  },
  deleteFile: (id: string, fileId: string) =>
    request<MessageResponse>(`/documents/${seg(id)}/files/${seg(fileId)}`, { method: 'DELETE' }),
};

export default api;
