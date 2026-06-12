import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function ProjectDetail() {
  const { id } = useParams();

  const [document, setDocument] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Edit state. Fields are display-only until the user clicks "Edit".
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '' });
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api.getDocument(id);
      setDocument(data.document);
      setCanEdit(Boolean(data.canEdit));
      setRole(data.role || null);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load project');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startEdit = () => {
    setNotice('');
    setForm({ title: document.title || '', summary: document.summary || '' });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setConfirming(false);
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Save is a two-step action: clicking Save opens a confirmation popup; the
  // actual PUT only happens after the user confirms.
  const requestSave = (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Title cannot be empty');
      return;
    }
    setConfirming(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setError('');
    try {
      const data = await api.updateDocument(id, {
        title: form.title.trim(),
        summary: form.summary.trim(),
      });
      setDocument(data.document);
      setEditing(false);
      setConfirming(false);
      setNotice('Project updated.');
    } catch (err) {
      setError(err.message || 'Could not update project');
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-center">Loading project…</div>;

  if (error && !document) {
    return (
      <div>
        <Link className="link-btn" to="/">← Back to dashboard</Link>
        <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>
      </div>
    );
  }

  return (
    <div>
      <Link className="link-btn" to="/">← Back to dashboard</Link>

      <div className="page-header" style={{ marginTop: '0.75rem' }}>
        <div>
          <h1>Project details</h1>
          <p className="muted">View and manage this project.</p>
        </div>
        {/* Edit button only appears for owners and admins. */}
        {canEdit && !editing && (
          <button type="button" className="btn btn-inline" onClick={startEdit}>
            Edit
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      <div className="card" style={{ maxWidth: 640 }}>
        {editing ? (
          <form onSubmit={requestSave}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={onChange}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="summary">Description</label>
              <textarea
                id="summary"
                name="summary"
                value={form.summary}
                onChange={onChange}
                rows={4}
                placeholder="A short description of this project"
              />
            </div>
            <div className="btn-row">
              <button type="submit" className="btn btn-inline">Save</button>
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="form-group">
              <span className="label muted">Title</span>
              <strong>{document.title}</strong>
            </div>
            <div className="form-group">
              <span className="label muted">Description</span>
              <span>{document.summary || <span className="muted">—</span>}</span>
            </div>
            <div className="form-group">
              <span className="label muted">Your role</span>
              <span className="badge badge-muted">{role || 'member'}</span>
            </div>
            <div className="form-group">
              <span className="label muted">Created</span>
              <strong>{formatDate(document.created_at)}</strong>
            </div>
            <div className="form-group">
              <span className="label muted">Last updated</span>
              <strong>{formatDate(document.updated_at)}</strong>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Link className="link-btn" to={`/documents/${id}/members`}>
          Manage members & settings →
        </Link>
      </div>

      {confirming && (
        <Modal
          title="Confirm changes"
          onClose={() => !saving && setConfirming(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirming(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="button" className="btn" onClick={confirmSave} disabled={saving}>
                {saving ? 'Saving…' : 'Confirm & save'}
              </button>
            </>
          }
        >
          <p>Save these changes to the project?</p>
          <div className="form-group">
            <span className="label muted">Title</span>
            <strong>{form.title.trim()}</strong>
          </div>
          <div className="form-group">
            <span className="label muted">Description</span>
            <span>{form.summary.trim() || <span className="muted">—</span>}</span>
          </div>
        </Modal>
      )}
    </div>
  );
}
