import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

const ROLE_TONE = { owner: 'badge-primary', editor: 'badge-success', viewer: 'badge-muted', admin: 'badge-warning' };

export default function Members() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add-member form
  const [form, setForm] = useState({ identifier: '', role: 'editor' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    try {
      const result = await api.listMembers(id);
      setData(result);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load members');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setNotice('');
    setSubmitting(true);
    try {
      const { member } = await api.addMember(id, form);
      setNotice(`Added ${member.username} as ${member.role}.`);
      setForm({ identifier: '', role: 'editor' });
      await load();
    } catch (err) {
      setFormError(err.message || 'Could not add member');
    } finally {
      setSubmitting(false);
    }
  };

  const onRemove = async (userId, username) => {
    setNotice('');
    setError('');
    try {
      await api.removeMember(id, userId);
      setNotice(`Removed ${username}.`);
      await load();
    } catch (err) {
      setError(err.message || 'Could not remove member');
    }
  };

  if (loading) return <div className="page-center">Loading members…</div>;

  if (error && !data) {
    return (
      <div>
        <Link className="link-btn" to="/">← Back to dashboard</Link>
        <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>
      </div>
    );
  }

  const canManage = data?.canManage;
  const rows = [
    ...(data?.owner ? [{ ...data.owner, isOwner: true }] : []),
    ...(data?.members || []).map((m) => ({ ...m, isOwner: false })),
  ];

  return (
    <div>
      <Link className="link-btn" to="/">← Back to dashboard</Link>

      <div className="page-header" style={{ marginTop: '0.75rem' }}>
        <div>
          <h1>{data?.document?.title || 'Project'}</h1>
          <p className="muted">Manage who can access this project.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      <div className="grid grid-2">
        <div className="card">
          <h2 className="section-title">Members</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  {canManage && <th aria-label="actions" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.user_id}>
                    <td className="strong">{m.username}</td>
                    <td className="muted">{m.email}</td>
                    <td>
                      <span className={`badge ${ROLE_TONE[m.role] || 'badge-muted'}`}>{m.role}</span>
                    </td>
                    {canManage && (
                      <td className="row-actions">
                        {m.isOwner ? (
                          <span className="muted small">—</span>
                        ) : (
                          <button
                            type="button"
                            className="link-btn danger"
                            onClick={() => onRemove(m.user_id, m.username)}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Add a member</h2>
          {canManage ? (
            <form onSubmit={onAdd}>
              {formError && <div className="error-banner">{formError}</div>}
              <div className="form-group">
                <label htmlFor="identifier">Username or email</label>
                <input
                  id="identifier"
                  name="identifier"
                  value={form.identifier}
                  onChange={onChange}
                  required
                  placeholder="jane or jane@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select id="role" name="role" value={form.role} onChange={onChange}>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add member'}
              </button>
            </form>
          ) : (
            <p className="muted">Only the project owner can add or remove members.</p>
          )}
        </div>
      </div>
    </div>
  );
}
