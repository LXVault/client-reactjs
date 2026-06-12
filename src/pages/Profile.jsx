import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function Profile() {
  const { user: ctxUser } = useAuth();
  const [user, setUser] = useState(ctxUser);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.profile();
        if (active) setUser(data.user);
      } catch (err) {
        // Fall back to the context user (from login) if the call fails.
        if (active) {
          setError(err.message || 'Could not refresh profile');
          setUser((prev) => prev || ctxUser);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ctxUser]);

  if (loading && !user) return <div className="page-center">Loading profile…</div>;

  return (
    <div>
      <h1>Profile</h1>
      {error && <div className="error-banner">{error}</div>}
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="form-group">
          <span className="label muted">Username</span>
          <strong>{user?.username || '—'}</strong>
        </div>
        <div className="form-group">
          <span className="label muted">Email</span>
          <strong>{user?.email || '—'}</strong>
        </div>
        <div className="form-group">
          <span className="label muted">User ID</span>
          <code className="muted">{user?.id || '—'}</code>
        </div>
        <div className="form-group">
          <span className="label muted">Member since</span>
          <strong>{formatDate(user?.created_at)}</strong>
        </div>
        <div className="form-group">
          <span className="label muted">Last updated</span>
          <strong>{formatDate(user?.updated_at)}</strong>
        </div>
      </div>
    </div>
  );
}
