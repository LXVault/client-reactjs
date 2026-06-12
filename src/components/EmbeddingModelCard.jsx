import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Per-project embedding model. Anyone with access can see it; only the owner or
// an admin can change it (enforced both here and server-side).
export default function EmbeddingModelCard({ projectId }) {
  const [model, setModel] = useState('');
  const [models, setModels] = useState([]);
  const [canConfigure, setCanConfigure] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    try {
      const data = await api.getEmbeddingModel(projectId);
      setModel(data.model);
      setModels(data.models || []);
      setCanConfigure(Boolean(data.canConfigure));
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load embedding model');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const onSave = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const data = await api.setEmbeddingModel(projectId, model);
      setModel(data.model);
      setNotice('Embedding model updated.');
    } catch (err) {
      setError(err.message || 'Could not update model');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h2 className="section-title">Embedding model</h2>
      <p className="muted" style={{ marginTop: '-0.4rem' }}>
        Model used for this project's semantic search (via each user's own
        OpenRouter key). Changing it applies to newly added knowledge.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <form onSubmit={onSave}>
          <div className="form-group">
            <label htmlFor="embedding-model">Model</label>
            <select
              id="embedding-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!canConfigure}
            >
              {/* Ensure the current value renders even if not in the allowlist */}
              {!models.includes(model) && <option value={model}>{model}</option>}
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {canConfigure ? (
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save model'}
            </button>
          ) : (
            <p className="muted small">
              Only the project owner or an admin can change the model.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
