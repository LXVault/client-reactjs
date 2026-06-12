import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function Tokens() {
  const [projects, setProjects] = useState([]);
  const [tokensByProject, setTokensByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // The raw token is only available once, right after generation.
  const [revealed, setRevealed] = useState(null); // { project, token }
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [docsRes, tokensRes] = await Promise.all([api.documents(), api.listTokens()]);
      const docs = docsRes?.documents || [];
      const map = {};
      (tokensRes?.tokens || []).forEach((t) => {
        map[t.project_id] = t;
      });
      setProjects(docs);
      setTokensByProject(map);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load tokens');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onGenerate = async (project) => {
    setNotice('');
    setError('');
    setBusyId(project.id);
    try {
      const data = await api.generateProjectToken(project.id);
      setRevealed({ project, token: data.token });
      setCopied(false);
      // Refresh metadata (created_at / rotated state) without the raw value.
      setTokensByProject((prev) => ({ ...prev, [project.id]: data.tokenInfo }));
    } catch (err) {
      setError(err.message || 'Could not generate token');
    } finally {
      setBusyId('');
    }
  };

  const onRevoke = async (project) => {
    setNotice('');
    setError('');
    setBusyId(project.id);
    try {
      await api.revokeProjectToken(project.id);
      setTokensByProject((prev) => {
        const next = { ...prev };
        delete next[project.id];
        return next;
      });
      setNotice(`Revoked the token for "${project.title}".`);
    } catch (err) {
      setError(err.message || 'Could not revoke token');
    } finally {
      setBusyId('');
    }
  };

  const copyToken = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed.token);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (loading) return <div className="page-center">Loading tokens…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Access Tokens</h1>
          <p className="muted">
            Generate one token per project for the MCP server. Every action it
            performs is traced back to you.
          </p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      {projects.length === 0 ? (
        <div className="card">
          <p className="muted">
            You have no projects yet. <Link className="link-btn" to="/">Create a project</Link>{' '}
            first, then come back to generate a token for it.
          </p>
        </div>
      ) : (
        <div className="card">
          <h2 className="section-title">Your projects</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Token</th>
                  <th>Last used</th>
                  <th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const token = tokensByProject[project.id];
                  const busy = busyId === project.id;
                  return (
                    <tr key={project.id}>
                      <td className="strong">{project.title}</td>
                      <td>
                        {token ? (
                          <span className="badge badge-success">
                            Active · since {formatDate(token.created_at)}
                          </span>
                        ) : (
                          <span className="badge badge-muted">No token</span>
                        )}
                      </td>
                      <td className="muted">
                        {token ? formatDate(token.last_used_at) : '—'}
                      </td>
                      <td className="row-actions">
                        <button
                          type="button"
                          className="link-btn"
                          disabled={busy}
                          onClick={() => onGenerate(project)}
                        >
                          {busy ? '…' : token ? 'Regenerate' : 'Generate'}
                        </button>
                        {token && (
                          <button
                            type="button"
                            className="link-btn danger"
                            disabled={busy}
                            onClick={() => onRevoke(project)}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {revealed && (
        <Modal
          title="Copy your new token"
          onClose={() => setRevealed(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setRevealed(null)}>
                Done
              </button>
              <button type="button" className="btn" onClick={copyToken}>
                {copied ? 'Copied!' : 'Copy token'}
              </button>
            </>
          }
        >
          <p className="muted">
            This is the token for <strong>{revealed.project.title}</strong>. It is shown
            only once — store it somewhere safe. Regenerating replaces it.
          </p>
          <pre className="token-reveal">
            <code>{revealed.token}</code>
          </pre>
        </Modal>
      )}
    </div>
  );
}
