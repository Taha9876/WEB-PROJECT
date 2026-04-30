import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import { UtensilsCrossed, Plus, X, Users, Send, Dumbbell, Heart } from 'lucide-react';

export default function DoctorRecommendations() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [recs, setRecs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ user_id: '', title: '', description: '', type: 'diet' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchData();

    const ch = supabase.channel('recs_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recommendations', filter: `doctor_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const fetchData = async () => {
    // Recommendations by this doctor  
    let recsData = [];
    try {
      const { data: r, error: recErr } = await supabase
        .from('recommendations')
        .select('*, patient:profiles!recommendations_user_id_fkey(name, email)')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });
      
      if (recErr) {
        console.error('Error fetching with join:', recErr);
        // Fallback: fetch without join
        const { data: r2 } = await supabase
          .from('recommendations')
          .select('*')
          .eq('doctor_id', user.id)
          .order('created_at', { ascending: false });
        recsData = r2 || [];
      } else {
        recsData = r || [];
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setRecs(recsData);

    // Get patients from messages AND appointments
    const seen = new Set();
    const pts = [];

    // From messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('sender_id, sender:profiles!messages_sender_id_fkey(id, name, email)')
      .eq('receiver_id', user.id);
    (msgs || []).forEach(m => {
      if (m.sender && !seen.has(m.sender_id)) {
        seen.add(m.sender_id);
        pts.push(m.sender);
      }
    });

    // From appointments
    const { data: appts } = await supabase
      .from('appointments')
      .select('user_id, user:profiles!appointments_user_id_fkey(id, name, email)')
      .eq('doctor_id', user.id);
    (appts || []).forEach(a => {
      if (a.user && !seen.has(a.user_id)) {
        seen.add(a.user_id);
        pts.push(a.user);
      }
    });

    setPatients(pts);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      // Build the insert payload - try with all common columns
      const payload = {
        doctor_id: user.id,
        user_id: form.user_id,
        title: form.title,
        description: form.description,
        type: form.type,
        recommendation: `${form.title}: ${form.description}`,
      };

      const { data, error: insertErr } = await supabase
        .from('recommendations')
        .insert(payload)
        .select();

      if (insertErr) {
        console.error('Insert error details:', insertErr);
        
        // If the error is about an unknown column, try without extra columns
        if (insertErr.message?.includes('column') || insertErr.code === '42703' || insertErr.code === 'PGRST204') {
          // Try minimal insert
          const minPayload = {
            doctor_id: user.id,
            user_id: form.user_id,
            recommendation: `${form.title}: ${form.description}`,
          };
          
          const { error: retryErr } = await supabase
            .from('recommendations')
            .insert(minPayload)
            .select();
          
          if (retryErr) {
            setError(retryErr.message || 'Failed to send recommendation. Check database permissions.');
            setSubmitting(false);
            return;
          }
        } else {
          setError(insertErr.message || 'Failed to create recommendation. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      setShowModal(false);
      setForm({ user_id: '', title: '', description: '', type: 'diet' });
      fetchData();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'exercise': return <Dumbbell size={22} />;
      case 'lifestyle': return <Heart size={22} />;
      default: return <UtensilsCrossed size={22} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'exercise': return { background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary-light)' };
      case 'lifestyle': return { background: 'rgba(236,72,153,0.12)', color: '#ec4899' };
      default: return { background: 'rgba(16,185,129,0.12)', color: 'var(--accent-success)' };
    }
  };

  return (
    <>
      <Header title="Recommendations" subtitle="Send diet and exercise plans to patients" />
      <div className="page-content">
        <div className="content-card">
          <div className="content-card-header">
            <h3>Your Recommendations</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); setError(''); }}>
              <Plus size={16} /> New Recommendation
            </button>
          </div>

          {recs.length > 0 ? (
            <div className="exercise-list">
              {recs.map(r => (
                <div key={r.id} className="exercise-item">
                  <div className="exercise-icon-box" style={getTypeColor(r.type)}>
                    {getTypeIcon(r.type)}
                  </div>
                  <div className="exercise-details">
                    <div className="exercise-name">{r.title || r.recommendation || 'Recommendation'}</div>
                    <div className="exercise-meta">For: {r.patient?.name || 'Patient'} · {r.type || 'general'}</div>
                    {r.description && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{r.description}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <UtensilsCrossed size={48} className="empty-icon" />
              <h3>No recommendations yet</h3>
              <p>Send personalized diet or exercise plans to your patients</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setSubmitting(false); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h2>New Recommendation</h2><button className="modal-close" onClick={() => { setShowModal(false); setSubmitting(false); }}><X size={18} /></button></div>
              <form className="modal-form" onSubmit={handleAdd}>
                {error && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginBottom: 4
                  }}>
                    ⚠️ {error}
                  </div>
                )}
                <div className="form-group">
                  <label>Patient</label>
                  <select className="form-select" value={form.user_id} onChange={e => setForm({...form, user_id: e.target.value})} required>
                    <option value="">Select patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                  </select>
                  {patients.length === 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginTop: 4 }}>
                      No patients found. Patients appear here once they message you or book an appointment.
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="diet">Diet Plan</option><option value="exercise">Exercise Plan</option><option value="lifestyle">Lifestyle</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" className="form-input" placeholder="e.g. Weekly Meal Plan" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" placeholder="Detailed recommendation..." rows={4}
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ resize: 'vertical' }} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setSubmitting(false); }} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send Recommendation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
