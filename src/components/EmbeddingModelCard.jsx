import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Per-project embedding model. Anyone with access can see it; only the owner or
// an admin can change it (enforced both here and server-side).
//
// A chunk carries one vector per model, so the model a project searches with and
// the models it has vectors for are different things. Showing both is what makes
// a switch readable: nothing is lost, some chunks are simply not embedded with
// the new model yet, and generating those is a separate, explicit step because
// it spends the user's own OpenRouter credits.
export default function EmbeddingModelCard({ projectId }) {
  const [model, setModel] = useState('');
  const [models, setModels] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [storedModels, setStoredModels] = useState([]);
  const [canConfigure, setCanConfigure] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [removing, setRemoving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Every endpoint returns the same payload, so one applier keeps the card in
  // step with the server after a read, a switch, a backfill or a removal.
  function apply(data) {
    setModel(data.model || '');
    setModels(data.models || []);
    setCoverage(data.coverage || null);
    setStoredModels(data.storedModels || []);
    if (data.canConfigure !== undefined) setCanConfigure(Boolean(data.canConfigure));
  }

  async function load() {
    try {
      apply(await api.getEmbeddingModel(projectId));
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
      apply(data);
      const pending = data.coverage ? data.coverage.pending : 0;
      setNotice(
        pending > 0
          ? `Model updated. ${pending} chunk${pending === 1 ? '' : 's'} are not embedded ` +
            'with it yet, so search will not find them until you generate the missing ' +
            'embeddings. Nothing was deleted.'
          : 'Model updated. Every chunk is already embedded with it, so search works now.'
      );
    } catch (err) {
      setError(err.message || 'Could not update model');
    } finally {
      setSaving(false);
    }
  };

  // The backend embeds in batches and reports what is left, so keep calling
  // while it makes progress. Stopping on a batch that embedded nothing avoids
  // looping forever if a chunk cannot be embedded at all.
  const onBackfill = async () => {
    setError('');
    setNotice('');
    setEmbedding(true);
    let total = 0;
    try {
      for (;;) {
        // eslint-disable-next-line no-await-in-loop
        const data = await api.backfillEmbeddings(projectId);
        apply(data);
        total += data.embedded || 0;
        if (!data.embedded || !data.coverage || data.coverage.pending === 0) break;
      }
      setNotice(
        total > 0
          ? `Embedded ${total} chunk${total === 1 ? '' : 's'} with ${model}.`
          : 'Nothing needed embedding.'
      );
    } catch (err) {
      setError(
        `${err.message || 'Could not generate embeddings'}${
          total > 0 ? ` (${total} embedded before this failed)` : ''
        }`
      );
      load();
    } finally {
      setEmbedding(false);
    }
  };

  const onRemoveModel = async (name) => {
    setError('');
    setNotice('');
    setRemoving(name);
    try {
      const data = await api.deleteModelEmbeddings(projectId, name);
      apply(data);
      setNotice(`Removed ${data.removed} embedding${data.removed === 1 ? '' : 's'} for ${name}.`);
    } catch (err) {
      setError(err.message || 'Could not remove embeddings');
    } finally {
      setRemoving('');
    }
  };

  const pending = coverage ? coverage.pending : 0;
  const total = coverage ? coverage.total : 0;
  const embedded = coverage ? coverage.embedded : 0;
  const percent = total > 0 ? Math.round((embedded / total) * 100) : 100;
  const busy = saving || embedding || Boolean(removing);

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h2 className="section-title">Embedding model</h2>
      <p className="muted" style={{ marginTop: '-0.4rem' }}>
        Model used for this project&apos;s semantic search, through each user&apos;s own
        OpenRouter key. Changing it never deletes anything: vectors for the previous model
        are kept, so switching back is instant.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <form onSubmit={onSave}>
            <div className="form-group">
              <label htmlFor="embedding-model">Model</label>
              {/* Free-text input with suggestions: pick a known model or type any
                  other OpenRouter embedding model id. */}
              <input
                id="embedding-model"
                list="embedding-model-options"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={!canConfigure || busy}
                placeholder="e.g. openai/text-embedding-3-small"
                autoComplete="off"
              />
              <datalist id="embedding-model-options">
                {models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            {canConfigure ? (
              <button className="btn btn-inline" type="submit" disabled={busy || !model.trim()}>
                {saving ? 'Saving…' : 'Save model'}
              </button>
            ) : (
              <p className="muted small">
                Only the project owner or an admin can change the model.
              </p>
            )}
          </form>

          {coverage && (
            <div style={{ marginTop: '1.25rem' }}>
              <h3 className="section-title" style={{ fontSize: '0.95rem' }}>
                Search coverage
              </h3>
              <div className="coverage-bar">
                <div
                  className={`coverage-bar-fill${pending === 0 ? ' is-complete' : ''}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="muted small">
                {total === 0
                  ? 'No knowledge yet. Upload a file to build this project’s knowledge base.'
                  : `${embedded} of ${total} chunk${total === 1 ? '' : 's'} embedded with this model.`}
                {pending > 0 && ` ${pending} not searchable until embedded.`}
              </p>

              {canConfigure && pending > 0 && (
                <>
                  <button
                    className="btn btn-inline"
                    type="button"
                    onClick={onBackfill}
                    disabled={busy}
                  >
                    {embedding ? 'Generating…' : `Generate ${pending} missing embedding${pending === 1 ? '' : 's'}`}
                  </button>
                  <p className="muted small" style={{ marginTop: '0.4rem' }}>
                    This uses your own OpenRouter key and spends your credits.
                  </p>
                </>
              )}
            </div>
          )}

          {storedModels.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <h3 className="section-title" style={{ fontSize: '0.95rem' }}>
                Models with stored embeddings
              </h3>
              <p className="muted small" style={{ marginTop: '-0.4rem' }}>
                Switching to any of these is instant. Removing one frees space but means
                re-embedding if you ever switch back.
              </p>
              <ul className="model-list">
                {storedModels.map((m) => (
                  <li key={m.model_name}>
                    <span className="model-name">
                      {m.model_name}
                      {m.model_name === model && (
                        <span className="badge badge-primary" style={{ marginLeft: '0.5rem' }}>
                          in use
                        </span>
                      )}
                    </span>
                    <span className="muted small">
                      {m.chunks} chunk{m.chunks === 1 ? '' : 's'}
                      {canConfigure && m.model_name !== model && (
                        <button
                          className="link-btn"
                          type="button"
                          style={{ marginLeft: '0.75rem' }}
                          onClick={() => onRemoveModel(m.model_name)}
                          disabled={busy}
                        >
                          {removing === m.model_name ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
