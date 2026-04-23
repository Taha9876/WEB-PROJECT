import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { UtensilsCrossed, Flame, Apple, Plus, X, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#ec4899'];

export default function MealPlan() {
  const { user, profile } = useAuth();
  const [meals, setMeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ meal_time: 'Breakfast', name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    fetchMeals();

    const channel = supabase
      .channel('meals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals', filter: `user_id=eq.${user.id}` }, () => {
        fetchMeals();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchMeals = async () => {
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true });
    setMeals(data || []);
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await supabase.from('meals').insert({
      user_id: user.id,
      name: form.name,
      meal_time: form.meal_time,
      calories: parseInt(form.calories) || 0,
      protein: parseInt(form.protein) || 0,
      carbs: parseInt(form.carbs) || 0,
      fat: parseInt(form.fat) || 0,
      date: today,
    });
    setForm({ meal_time: 'Breakfast', name: '', calories: '', protein: '', carbs: '', fat: '' });
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('meals').delete().eq('id', id);
  };

  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const macroData = [
    { name: 'Protein', value: totals.protein, color: '#6366f1' },
    { name: 'Carbs', value: totals.carbs, color: '#f59e0b' },
    { name: 'Fat', value: totals.fat, color: '#ec4899' },
  ];

  const calorieGoal = profile?.daily_calorie_goal || 2000;

  return (
    <>
      <Header title="Meal Plans" subtitle="Track your nutrition and diet" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={Flame} label="Total Calories" value={totals.calories.toString()} change={`Goal: ${calorieGoal}`} color="orange" />
          <StatCard icon={UtensilsCrossed} label="Meals Today" value={meals.length.toString()} color="purple" />
          <StatCard icon={Apple} label="Protein Intake" value={`${totals.protein}g`} color="green" />
        </div>

        <div className="two-col-grid">
          <div className="content-card">
            <div className="content-card-header">
              <div>
                <h3>Today's Meals</h3>
                <div className="subtitle">{today}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add Meal
              </button>
            </div>
            {meals.length > 0 ? (
              <div className="meal-grid" style={{ gridTemplateColumns: '1fr' }}>
                {meals.map(meal => (
                  <div key={meal.id} className="meal-card">
                    <div className="meal-card-header">
                      <span className="meal-time">{meal.meal_time}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="meal-calories">{meal.calories} kcal</span>
                        <button className="btn btn-danger btn-sm" style={{ padding: '4px 6px' }} onClick={() => handleDelete(meal.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="meal-name">{meal.name}</div>
                    <div className="meal-macros">
                      <div className="macro-item">
                        <span className="macro-label">Protein</span>
                        <span className="macro-value protein">{meal.protein}g</span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-label">Carbs</span>
                        <span className="macro-value carbs">{meal.carbs}g</span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-label">Fat</span>
                        <span className="macro-value fat">{meal.fat}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <UtensilsCrossed size={48} className="empty-icon" />
                <h3>No meals logged today</h3>
                <p>Click "Add Meal" to start tracking</p>
              </div>
            )}
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3>Macro Breakdown</h3>
            </div>
            {(totals.protein + totals.carbs + totals.fat) > 0 ? (
              <>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                        paddingAngle={4} dataKey="value" stroke="none">
                        {macroData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
                  {macroData.map((m, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.name}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700 }}>{m.value}g</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Apple size={48} className="empty-icon" />
                <h3>No macro data</h3>
                <p>Add meals with nutritional info to see your macro breakdown</p>
              </div>
            )}

            <div style={{ marginTop: 24, padding: 16, background: 'rgba(245,158,11,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <h4 style={{ marginBottom: 8, color: 'var(--accent-warning)', fontSize: '0.9rem' }}>📊 Daily Summary</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Calories: <strong>{totals.calories} / {calorieGoal}</strong></span>
                <span style={{ color: totals.calories <= calorieGoal ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {totals.calories <= calorieGoal ? '✅ On Track' : '⚠️ Over'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Meal</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <form className="modal-form" onSubmit={handleAdd}>
                <div className="form-group">
                  <label>Meal Time</label>
                  <select className="form-select" value={form.meal_time} onChange={e => setForm({...form, meal_time: e.target.value})}>
                    <option>Breakfast</option><option>Snack</option><option>Lunch</option><option>Dinner</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Meal Name</label>
                  <input type="text" className="form-input" placeholder="Grilled Chicken Salad"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Calories</label>
                    <input type="number" className="form-input" placeholder="400"
                      value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Protein (g)</label>
                    <input type="number" className="form-input" placeholder="30"
                      value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Carbs (g)</label>
                    <input type="number" className="form-input" placeholder="40"
                      value={form.carbs} onChange={e => setForm({...form, carbs: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Fat (g)</label>
                    <input type="number" className="form-input" placeholder="15"
                      value={form.fat} onChange={e => setForm({...form, fat: e.target.value})} />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Add Meal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
