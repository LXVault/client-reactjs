import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';

// Mirror the backend allow-list so the picker only offers valid types.
const ALLOWED_FILE_TYPES = '.md,.txt,.pdf';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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

  // Knowledge-base files (the project's central index).
  const [files, setFiles] = useState([]);
  const [filesError, setFilesError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

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

  async function loadFiles() {
    try {
      const data = await api.listFiles(id);
      setFiles(data.files || []);
      setFilesError('');
    } catch (err) {
      setFilesError(err.message || 'Could not load files');
    }
  }

  useEffect(() => {
    load();
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onUpload = async (e) => {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;
    setUploading(true);
    setFilesError('');
    setNotice('');
    try {
      const data = await api.uploadFiles(id, picked);
      const failed = (data && data.failed) || [];
      const okCount = (data && data.files ? data.files.length : 0);
      if (okCount > 0) {
        setNotice(
          `Uploaded ${okCount} file${okCount === 1 ? '' : 's'} to the knowledge base.`
        );
      }
      if (failed.length > 0) {
        setFilesError(
          `Some files were skipped: ${failed.map((f) => `${f.filename} (${f.error})`).join('; ')}`
        );
      }
      await loadFiles();
      await load();
    } catch (err) {
      setFilesError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setDeleting(true);
    setFilesError('');
    try {
      await api.deleteFile(id, fileToDelete.id);
      setNotice(`Removed "${fileToDelete.filename}" from the knowledge base.`);
      setFileToDelete(null);
      await loadFiles();
      await load();
    } catch (err) {
      setFilesError(err.message || 'Could not delete file');
    } finally {
      setDeleting(false);
    }
  };

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

      {/* Central index: the files this project's knowledge base was built from. */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: '0.75rem' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Knowledge files</h2>
            <p className="muted" style={{ margin: 0 }}>
              The source files this project's knowledge base was built from
              (.md, .txt, .pdf). Each file is split into searchable chunks.
            </p>
          </div>
          {/* Upload is owner/admin only. */}
          {canEdit && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_FILE_TYPES}
                multiple
                onChange={onUpload}
                disabled={uploading}
                style={{ display: 'none' }}
                id="file-upload-input"
              />
              <button
                type="button"
                className="btn btn-inline"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : '+ Upload files'}
              </button>
            </div>
          )}
        </div>

        {filesError && <div className="error-banner">{filesError}</div>}

        {files.length === 0 ? (
          <p className="muted">
            No files yet.{' '}
            {canEdit
              ? 'Upload .md, .txt or .pdf files to populate the knowledge base.'
              : 'An owner or admin can upload files to populate the knowledge base.'}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Chunks</th>
                  <th>Uploaded by</th>
                  <th>Uploaded</th>
                  {canEdit && <th aria-label="actions" />}
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="strong">{file.filename}</td>
                    <td>
                      <span className="badge badge-muted">{file.file_type}</span>
                    </td>
                    <td className="muted">{formatBytes(file.byte_size)}</td>
                    <td>{file.chunk_count ?? 0}</td>
                    <td className="muted">{file.uploaded_by || '—'}</td>
                    <td className="muted">{formatDate(file.created_at)}</td>
                    {canEdit && (
                      <td className="row-actions">
                        <button
                          type="button"
                          className="link-btn danger"
                          onClick={() => setFileToDelete(file)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Link className="link-btn" to={`/documents/${id}/members`}>
          Manage members & settings →
        </Link>
      </div>

      {fileToDelete && (
        <Modal
          title="Delete file"
          onClose={() => !deleting && setFileToDelete(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setFileToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={confirmDeleteFile}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete file'}
              </button>
            </>
          }
        >
          <p>
            Delete <strong>{fileToDelete.filename}</strong> and its{' '}
            {fileToDelete.chunk_count ?? 0} knowledge chunk
            {fileToDelete.chunk_count === 1 ? '' : 's'}? This cannot be undone.
          </p>
        </Modal>
      )}

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
