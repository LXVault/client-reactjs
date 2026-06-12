import { useEffect, useState } from 'react';
import { api } from '../api/client';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

// Lets a user store their own OpenRouter API key. The key is encrypted
// server-side and used whenever *they* run semantic search / add knowledge.
// The plaintext is never returned — only a masked status.
export default function OpenRouterKeyCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    try {
      const data = await api.getOpenRouterKey();
      setStatus(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load key status');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const data = await api.setOpenRouterKey(value.trim());
      setStatus(data);
      setValue('');
      setNotice('Key saved. It is encrypted and used only for your searches.');
    } catch (err) {
      setError(err.message || 'Could not save key');
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async () => {
    setError('');
    setNotice('');
    try {
      await api.deleteOpenRouterKey();
      setStatus({ configured: false, last4: null, updatedAt: null });
      setNotice('Key removed.');
    } catch (err) {
      setError(err.message || 'Could not remove key');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, marginTop: '1.5rem' }}>
      <h2 className="section-title">OpenRouter API key</h2>
      <p className="muted" style={{ marginTop: '-0.4rem' }}>
        Required for semantic search. Each user supplies their own key — it is
        encrypted at rest and used only for your own queries.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="form-group">
            <span className="label muted">Status</span>
            {status?.configured ? (
              <strong>
                Configured · ••••{status.last4}{' '}
                <span className="muted small">(updated {formatDate(status.updatedAt)})</span>
              </strong>
            ) : (
              <span className="badge badge-warning">Not configured</span>
            )}
          </div>

          <form onSubmit={onSave}>
            <div className="form-group">
              <label htmlFor="orkey">
                {status?.configured ? 'Replace key' : 'Add key'}
              </label>
              <input
                id="orkey"
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="sk-or-..."
                autoComplete="off"
              />
            </div>
            <div className="btn-row">
              <button
                className="btn btn-inline"
                type="submit"
                disabled={saving || !value.trim()}
              >
                {saving ? 'Saving…' : 'Save key'}
              </button>
              {status?.configured && (
                <button type="button" className="btn btn-ghost" onClick={onRemove}>
                  Remove
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
