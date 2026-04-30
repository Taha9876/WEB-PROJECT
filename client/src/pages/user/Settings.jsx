import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { User, Save, Bell, Shield, Palette, CheckCircle } from 'lucide-react';

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    age: '',
    weight: '',
    height: '',
    goal_weight: '',
    daily_calorie_goal: '',
    water_goal: '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        age: profile.age || '',
        weight: profile.weight || '',
        height: profile.height || '',
        goal_weight: profile.goal_weight || '',
        daily_calorie_goal: profile.daily_calorie_goal || 2000,
        water_goal: profile.water_goal || 8,
      });
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    await updateProfile({
      name: form.name,
      age: form.age ? parseInt(form.age) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      goal_weight: form.goal_weight ? parseFloat(form.goal_weight) : null,
      daily_calorie_goal: form.daily_calorie_goal ? parseInt(form.daily_calorie_goal) : 2000,
      water_goal: form.water_goal ? parseInt(form.water_goal) : 8,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <Header title="Settings" subtitle="Manage your account preferences" />
      <div className="page-content">
        {saved && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-md)', marginBottom: 20, color: 'var(--accent-success)',
            fontSize: '0.9rem', fontWeight: 600, animation: 'fadeIn 0.3s ease'
          }}>
            <CheckCircle size={18} /> Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="two-col-grid">
            <div className="content-card">
              <div className="content-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <User size={20} color="var(--accent-primary-light)" />
                  <h3>Profile Information</h3>
                </div>
              </div>
              <div className="modal-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-input" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-input" value={form.email} disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input type="number" className="form-input" value={form.age}
                      onChange={e => setForm({ ...form, age: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Height (cm)</label>
                    <input type="number" className="form-input" value={form.height}
                      onChange={e => setForm({ ...form, height: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Current Weight (kg)</label>
                    <input type="number" step="0.1" className="form-input" value={form.weight}
                      onChange={e => setForm({ ...form, weight: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Goal Weight (kg)</label>
                    <input type="number" step="0.1" className="form-input" value={form.goal_weight}
                      onChange={e => setForm({ ...form, goal_weight: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="content-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Palette size={20} color="var(--accent-warning)" />
                  <h3>Health Goals</h3>
                </div>
              </div>
              <div className="modal-form">
                <div className="form-group">
                  <label>Daily Calorie Target</label>
                  <input type="number" className="form-input" value={form.daily_calorie_goal}
                    onChange={e => setForm({ ...form, daily_calorie_goal: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Daily Water Goal (glasses)</label>
                  <input type="number" className="form-input" value={form.water_goal}
                    onChange={e => setForm({ ...form, water_goal: e.target.value })} />
                </div>
              </div>

              <div style={{ marginTop: 24, padding: 16, background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <h4 style={{ marginBottom: 8, color: 'var(--accent-primary-light)', fontSize: '0.9rem' }}>💡 About Your Goals</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Setting realistic goals helps you stay consistent. A calorie target of 1,800–2,200 and 8 glasses of water per day is recommended for most adults.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
