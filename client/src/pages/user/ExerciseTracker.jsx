import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { Dumbbell, Flame, Clock, Plus, X, Heart, TrendingUp, Bike, Zap, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const iconMap = { cardio: Heart, strength: Dumbbell, yoga: TrendingUp, cycling: Bike };

export default function ExerciseTracker() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'cardio', duration: '', calories: '' });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    fetchExercises();

    const channel = supabase
      .channel('exercises_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exercises', filter: `user_id=eq.${user.id}` }, () => {
        fetchExercises();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setExercises(data || []);
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await supabase.from('exercises').insert({
      user_id: user.id,
      name: form.name,
      type: form.type,
      duration: parseInt(form.duration),
      calories: parseInt(form.calories),
      date: today,
    });
    setForm({ name: '', type: 'cardio', duration: '', calories: '' });
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('exercises').delete().eq('id', id);
  };

  const todayExercises = exercises.filter(e => e.date === today);
  const totalCal = todayExercises.reduce((s, e) => s + (e.calories || 0), 0);
  const totalMin = todayExercises.reduce((s, e) => s + (e.duration || 0), 0);

  // Build weekly chart from last 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const weeklyData = weekDays.map(day => ({
    day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
    calories: exercises.filter(e => e.date === day).reduce((s, e) => s + (e.calories || 0), 0),
  }));

  return (
    <>
      <Header title="Exercise Tracker" subtitle="Log and track your workouts" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={Flame} label="Calories Burned Today" value={totalCal.toString()} color="orange" />
          <StatCard icon={Clock} label="Active Minutes" value={`${totalMin} min`} color="blue" />
          <StatCard icon={Dumbbell} label="Workouts Today" value={todayExercises.length.toString()} color="purple" />
          <StatCard icon={Zap} label="Total Logged" value={exercises.length.toString()} color="green" />
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3>Weekly Calories Burned</h3>
              <div className="subtitle">Last 7 days</div>
            </div>
          </div>
          {weeklyData.some(d => d.calories > 0) ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                  <Bar dataKey="calories" fill="url(#calGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <Dumbbell size={48} className="empty-icon" />
              <h3>No exercise data this week</h3>
              <p>Start logging workouts to see your weekly chart</p>
            </div>
          )}
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3>Exercise Log</h3>
              <div className="subtitle">All workouts</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Workout
            </button>
          </div>
          {exercises.length > 0 ? (
            <div className="exercise-list">
              {exercises.map(ex => {
                const Icon = iconMap[ex.type] || Dumbbell;
                return (
                  <div key={ex.id} className="exercise-item">
                    <div className={`exercise-icon-box ${ex.type}`}>
                      <Icon size={22} />
                    </div>
                    <div className="exercise-details">
                      <div className="exercise-name">{ex.name}</div>
                      <div className="exercise-meta">{ex.date} · {ex.type}</div>
                    </div>
                    <div className="exercise-stats">
                      <div className="exercise-stat">
                        <div className="exercise-stat-value">{ex.duration}</div>
                        <div className="exercise-stat-label">min</div>
                      </div>
                      <div className="exercise-stat">
                        <div className="exercise-stat-value" style={{ color: 'var(--accent-warning)' }}>{ex.calories}</div>
                        <div className="exercise-stat-label">kcal</div>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm" style={{ padding: '6px 8px' }} onClick={() => handleDelete(ex.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Dumbbell size={48} className="empty-icon" />
              <h3>No workouts logged</h3>
              <p>Click "Add Workout" to get started</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Workout</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <form className="modal-form" onSubmit={handleAdd}>
                <div className="form-group">
                  <label>Exercise Name</label>
                  <input type="text" className="form-input" placeholder="Morning Run"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="cardio">Cardio</option>
                    <option value="strength">Strength</option>
                    <option value="yoga">Yoga</option>
                    <option value="cycling">Cycling</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Duration (min)</label>
                    <input type="number" className="form-input" placeholder="30"
                      value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Calories Burned</label>
                    <input type="number" className="form-input" placeholder="300"
                      value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} required />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Add Workout</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
