import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../api/client';

// Fallback dataset used when the API is empty or unreachable.
const MOCK_ANALYSIS = {
  totalDocuments: 3,
  totalChunks: 54,
  chunksPerDocument: [
    { document_id: 'mock-2', title: 'API Reference', chunk_count: 34 },
    { document_id: 'mock-1', title: 'Onboarding Guide', chunk_count: 12 },
    { document_id: 'mock-3', title: 'Security Policy', chunk_count: 8 },
  ],
  roleDistribution: [
    { role: 'owner', count: 3 },
    { role: 'editor', count: 5 },
    { role: 'viewer', count: 2 },
  ],
};

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

export default function Analysis() {
  const [data, setData] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await api.analysis();
        if (!active) return;
        const isEmpty = !result || (result.totalDocuments === 0 && result.totalChunks === 0);
        if (isEmpty) {
          setData(MOCK_ANALYSIS);
          setUsingMock(true);
        } else {
          // Ensure arrays exist even if the API omits them.
          setData({
            chunksPerDocument: [],
            roleDistribution: [],
            ...result,
          });
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Could not load analysis');
        setData(MOCK_ANALYSIS);
        setUsingMock(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="page-center">Loading analysis…</div>;
  if (!data) return <div className="page-center">No analysis data.</div>;

  const barData = (data.chunksPerDocument || []).map((d) => ({
    name: d.title,
    chunks: d.chunk_count,
  }));
  const pieData = (data.roleDistribution || []).map((r) => ({
    name: r.role,
    value: r.count,
  }));

  return (
    <div>
      <h1>Analysis</h1>
      {error && <div className="error-banner">{error}</div>}
      {usingMock && (
        <p className="notice">Showing sample data — the API returned no metrics yet.</p>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="value">{data.totalDocuments ?? 0}</div>
          <div className="label">Total documents</div>
        </div>
        <div className="stat-card">
          <div className="value">{data.totalChunks ?? 0}</div>
          <div className="label">Total chunks</div>
        </div>
        <div className="stat-card">
          <div className="value">
            {data.totalDocuments
              ? Math.round((data.totalChunks / data.totalDocuments) * 10) / 10
              : 0}
          </div>
          <div className="label">Avg chunks / doc</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 className="section-title">Chunks per document</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              />
              <Bar dataKey="chunks" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="section-title">Member role distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.name} (${entry.value})`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
