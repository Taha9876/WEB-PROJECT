import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { Scale, TrendingDown, Target, Plus, X, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightTracker() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchLogs();

    // Realtime subscription
    const channel = supabase
      .channel('weight_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weight_logs', filter: `user_id=eq.${user.id}` }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    setLogs((data || []).map(w => ({ ...w, weight: parseFloat(w.weight) })));
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newWeight) return;

    await supabase.from('weight_logs').insert({
      user_id: user.id,
      weight: parseFloat(newWeight),
      date: newDate,
    });

    setNewWeight('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('weight_logs').delete().eq('id', id);
  };

  const current = logs.length > 0 ? logs[logs.length - 1].weight : 0;
  const start = logs.length > 0 ? logs[0].weight : 0;
  const change = logs.length > 1 ? (current - start).toFixed(1) : '0';
  const goalWeight = profile?.goal_weight || 70;

  return (
    <>
      <Header title="Weight Tracker" subtitle="Monitor your weight journey" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={Scale} label="Current Weight" value={current ? `${current} kg` : '—'} color="purple" />
          <StatCard icon={Target} label="Goal Weight" value={`${goalWeight} kg`} color="blue" />
          <StatCard icon={TrendingDown} label="Total Change" value={logs.length > 1 ? `${change} kg` : '—'} color="green" />
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3>Weight History</h3>
              <div className="subtitle">Your progress over time</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Log Weight
            </button>
          </div>
          {logs.length > 0 ? (
            <div className="chart-container" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs}>
                  <defs>
                    <linearGradient id="wLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                  <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                  <Line type="monotone" dataKey="weight" stroke="url(#wLine)" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} activeDot={{ r: 7, fill: '#a855f7' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <Scale size={48} className="empty-icon" />
              <h3>No entries yet</h3>
              <p>Click "Log Weight" to add your first weight entry</p>
            </div>
          )}
        </div>

        {logs.length > 0 && (
          <div className="content-card">
            <div className="content-card-header"><h3>Log History</h3></div>
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Weight</th><th>Change</th><th></th></tr>
              </thead>
              <tbody>
                {[...logs].reverse().map((log, i, arr) => {
                  const prev = arr[i + 1];
                  const diff = prev ? (log.weight - prev.weight).toFixed(1) : null;
                  return (
                    <tr key={log.id}>
                      <td>{log.date}</td>
                      <td style={{ fontWeight: 700 }}>{log.weight} kg</td>
                      <td>
                        {diff !== null && (
                          <span className={`badge-status ${parseFloat(diff) <= 0 ? 'badge-active' : 'badge-cancelled'}`}>
                            {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
                          </span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleDelete(log.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Log Weight</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <form className="modal-form" onSubmit={handleAdd}>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="form-input" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.1" className="form-input" placeholder="73.5"
                    value={newWeight} onChange={e => setNewWeight(e.target.value)} required autoFocus />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
