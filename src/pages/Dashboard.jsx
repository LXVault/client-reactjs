import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Shown when the API returns no documents or is unreachable, so the UI is
// never empty during development.
const MOCK_DOCUMENTS = [
  { id: 'mock-1', title: 'Onboarding Guide', summary: 'How to get started with the platform.', role: 'owner', chunk_count: 12, updated_at: '2026-06-01T10:00:00Z' },
  { id: 'mock-2', title: 'API Reference', summary: 'Endpoints, auth and rate limits.', role: 'editor', chunk_count: 34, updated_at: '2026-06-05T14:30:00Z' },
  { id: 'mock-3', title: 'Security Policy', summary: 'Data handling and access control.', role: 'viewer', chunk_count: 8, updated_at: '2026-06-08T09:15:00Z' },
];

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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.documents();
        const docs = data?.documents || [];
        if (!active) return;
        if (docs.length === 0) {
          setDocuments(MOCK_DOCUMENTS);
          setUsingMock(true);
        } else {
          setDocuments(docs);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Could not load documents');
        setDocuments(MOCK_DOCUMENTS);
        setUsingMock(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="page-center">Loading documents…</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <div className="error-banner">{error}</div>}
      {usingMock && (
        <p className="notice">Showing sample data — no documents returned by the API yet.</p>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="value">{documents.length}</div>
          <div className="label">Documents</div>
        </div>
        <div className="stat-card">
          <div className="value">
            {documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0)}
          </div>
          <div className="label">Total chunks</div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Your documents</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Summary</th>
              <th>Role</th>
              <th>Chunks</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.title}</td>
                <td className="muted">{doc.summary || '—'}</td>
                <td>
                  <span className="badge">{doc.role || 'editor'}</span>
                </td>
                <td>{doc.chunk_count ?? 0}</td>
                <td className="muted">{formatDate(doc.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
