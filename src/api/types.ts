// Response and payload shapes for the Express API, as this client reads them.
// The backend owns these contracts; the types here describe only the fields
// the screens actually use, and mark as optional anything the client already
// guards against being absent.

export interface User {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends Credentials {
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ProfileResponse {
  user: User;
}

// The backend calls a project a `document`; the UI calls it a project.
export interface DocumentSummary {
  id: string;
  title: string;
  summary?: string | null;
  role?: string;
  chunk_count?: number;
  file_count?: number;
  updated_at?: string;
  is_owner?: boolean;
}

export interface DocumentsResponse {
  documents: DocumentSummary[];
  total?: number;
}

export interface ProjectDocument {
  id: string;
  title: string;
  summary?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentPayload {
  title: string;
  summary: string;
}

export interface DocumentResponse {
  document: ProjectDocument;
  canEdit?: boolean;
  role?: string | null;
}

export interface UpdateDocumentResponse {
  document: ProjectDocument;
}

export interface ChunksPerDocument {
  document_id: string;
  title: string;
  chunk_count: number;
}

export interface RoleCount {
  role: string;
  count: number;
}

export interface AnalysisResponse {
  totalDocuments: number;
  totalChunks: number;
  chunksPerDocument?: ChunksPerDocument[];
  roleDistribution?: RoleCount[];
}

export interface Member {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

export interface MembersResponse {
  document?: { id: string; title: string };
  owner?: Member | null;
  members?: Member[];
  canManage?: boolean;
}

export interface AddMemberPayload {
  identifier: string;
  role: string;
}

export interface AddMemberResponse {
  member: Member;
}

export interface TokenInfo {
  project_id: string;
  created_at?: string;
  last_used_at?: string | null;
}

export interface TokensResponse {
  tokens: TokenInfo[];
  total?: number;
}

export interface ProjectTokenResponse {
  token: TokenInfo | null;
}

export interface GenerateTokenResponse {
  token: string;
  tokenInfo: TokenInfo;
}

export interface OpenRouterKeyStatus {
  configured: boolean;
  last4: string | null;
  updatedAt: string | null;
}

export interface EmbeddingCoverage {
  total: number;
  embedded: number;
  pending: number;
}

export interface StoredModel {
  model_name: string;
  chunks: number;
}

// Every embedding endpoint returns this payload, so one applier handles them all.
export interface EmbeddingModelResponse {
  model?: string;
  models?: string[];
  coverage?: EmbeddingCoverage | null;
  storedModels?: StoredModel[];
  canConfigure?: boolean;
}

export interface BackfillResponse extends EmbeddingModelResponse {
  embedded?: number;
}

export interface DeleteModelEmbeddingsResponse extends EmbeddingModelResponse {
  removed: number;
}

export interface KnowledgeFile {
  id: string;
  filename: string;
  file_type: string;
  byte_size?: number | null;
  chunk_count?: number | null;
  uploaded_by?: string | null;
  created_at?: string;
}

export interface FilesResponse {
  files: KnowledgeFile[];
  total?: number;
  canManage?: boolean;
}

export interface FailedUpload {
  filename: string;
  error: string;
}

export interface UploadResponse {
  files?: KnowledgeFile[];
  failed?: FailedUpload[];
}

export interface MessageResponse {
  message?: string;
}
