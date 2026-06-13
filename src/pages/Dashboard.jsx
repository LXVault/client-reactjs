import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';

// Shown when the API returns no documents or is unreachable, so the UI is
// never empty during development.
const MOCK_DOCUMENTS = [
  { id: 'mock-1', title: 'Onboarding Guide', summary: 'How to get started with the platform.', role: 'owner', chunk_count: 12, file_count: 2, updated_at: '2026-06-01T10:00:00Z', is_owner: true },
  { id: 'mock-2', title: 'API Reference', summary: 'Endpoints, auth and rate limits.', role: 'editor', chunk_count: 34, file_count: 5, updated_at: '2026-06-05T14:30:00Z', is_owner: false },
  { id: 'mock-3', title: 'Security Policy', summary: 'Data handling and access control.', role: 'viewer', chunk_count: 8, file_count: 1, updated_at: '2026-06-08T09:15:00Z', is_owner: false },
];

const ROLE_TONE = { owner: 'badge-primary', editor: 'badge-success', viewer: 'badge-muted', admin: 'badge-warning' };

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create-project modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  async function loadDocuments() {
    try {
      const data = await api.documents();
      const docs = data?.documents || [];
      if (docs.length === 0) {
        setDocuments(MOCK_DOCUMENTS);
        setUsingMock(true);
      } else {
        setDocuments(docs);
        setUsingMock(false);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load documents');
      setDocuments(MOCK_DOCUMENTS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await api.createDocument(form);
      setShowCreate(false);
      setForm({ title: '', summary: '' });
      await loadDocuments();
    } catch (err) {
      setCreateError(err.message || 'Could not create project');
    } finally {
      setCreating(false);
    }
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
  const totalFiles = documents.reduce((sum, d) => sum + (d.file_count || 0), 0);

  if (loading) return <div className="page-center">Loading documents…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Your knowledge-base projects and their chunks.</p>
        </div>
        <button type="button" className="btn btn-inline" onClick={() => setShowCreate(true)}>
          + New Project
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {usingMock && (
        <p className="notice">Showing sample data — create a project to get started.</p>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="value">{documents.length}</div>
          <div className="label">Projects</div>
        </div>
        <div className="stat-card">
          <div className="value">{totalChunks}</div>
          <div className="label">Total chunks</div>
        </div>
        <div className="stat-card">
          <div className="value">{totalFiles}</div>
          <div className="label">Uploaded files</div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Your projects</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Summary</th>
                <th>Role</th>
                <th>Files</th>
                <th>Chunks</th>
                <th>Updated</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="strong">{doc.title}</td>
                  <td className="muted">{doc.summary || '—'}</td>
                  <td>
                    <span className={`badge ${ROLE_TONE[doc.role] || 'badge-muted'}`}>
                      {doc.role || 'editor'}
                    </span>
                  </td>
                  <td>{doc.file_count ?? 0}</td>
                  <td>{doc.chunk_count ?? 0}</td>
                  <td className="muted">{formatDate(doc.updated_at)}</td>
                  <td className="row-actions">
                    {usingMock ? (
                      <span className="muted small">demo</span>
                    ) : (
                      <>
                        <Link className="link-btn" to={`/documents/${doc.id}`}>
                          Details
                        </Link>
                        <Link className="link-btn" to={`/documents/${doc.id}/members`}>
                          Members
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <Modal
          title="Create a new project"
          onClose={() => !creating && setShowCreate(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowCreate(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button type="submit" form="create-project-form" className="btn" disabled={creating}>
                {creating ? 'Creating…' : 'Create project'}
              </button>
            </>
          }
        >
          {createError && <div className="error-banner">{createError}</div>}
          <form id="create-project-form" onSubmit={onCreate}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={onChange}
                required
                autoFocus
                placeholder="e.g. Product Handbook"
              />
            </div>
            <div className="form-group">
              <label htmlFor="summary">Summary (optional)</label>
              <textarea
                id="summary"
                name="summary"
                value={form.summary}
                onChange={onChange}
                rows={3}
                placeholder="A short description of this project"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
