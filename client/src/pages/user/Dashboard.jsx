import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { Scale, Dumbbell, Droplets, Flame, TrendingUp, Heart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="value" style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [weightData, setWeightData] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [waterToday, setWaterToday] = useState(0);
  const [mealsToday, setMealsToday] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const firstName = (profile?.name || 'User').split(' ')[0];
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    const uid = user.id;

    // Fetch weight logs (last 7)
    const { data: weights } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: true })
      .limit(7);

    // Fetch today's exercises
    const { data: exs } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', uid)
      .eq('date', today)
      .order('created_at', { ascending: false });

    // Fetch today's water
    const { data: water } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', uid)
      .eq('date', today)
      .single();

    // Fetch today's meals
    const { data: mls } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', uid)
      .eq('date', today);

    setWeightData((weights || []).map(w => ({ date: w.date, weight: parseFloat(w.weight) })));
    setExercises(exs || []);
    setWaterToday(water?.glasses || 0);
    setMealsToday(mls || []);
    setLoading(false);
  };

  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : (profile?.weight || 0);
  const totalCalBurned = exercises.reduce((s, e) => s + (e.calories || 0), 0);
  const totalCalConsumed = mealsToday.reduce((s, m) => s + (m.calories || 0), 0);
  const waterGoal = profile?.water_goal || 8;

  const calorieData = mealsToday.length > 0 || exercises.length > 0 ? [
    { label: 'Burned', value: totalCalBurned },
    { label: 'Consumed', value: totalCalConsumed },
  ] : [];

  return (
    <>
      <Header title={`Welcome back, ${firstName} 👋`} subtitle={dateStr} />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={Scale} label="Current Weight" value={currentWeight ? `${currentWeight} kg` : '—'} color="purple" />
          <StatCard icon={Flame} label="Calories Burned Today" value={totalCalBurned.toString()} color="orange" />
          <StatCard icon={Droplets} label="Water Today" value={`${waterToday} / ${waterGoal}`} color="blue" />
          <StatCard icon={Dumbbell} label="Workouts Today" value={exercises.length.toString()} color="green" />
        </div>

        <div className="two-col-grid">
          <div className="content-card">
            <div className="content-card-header">
              <div>
                <h3>Weight Trend</h3>
                <div className="subtitle">Recent entries</div>
              </div>
              <TrendingUp size={20} color="var(--accent-primary-light)" />
            </div>
            {weightData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
                    <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2.5} fill="url(#weightGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <Scale size={48} className="empty-icon" />
                <h3>No weight data yet</h3>
                <p>Go to Weight Tracker to log your first entry</p>
              </div>
            )}
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <div>
                <h3>Today's Calories</h3>
                <div className="subtitle">Burned vs Consumed</div>
              </div>
              <Flame size={20} color="var(--accent-warning)" />
            </div>
            {calorieData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calorieData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" />
                    <YAxis stroke="rgba(255,255,255,0.3)" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="kcal" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <Flame size={48} className="empty-icon" />
                <h3>No data yet</h3>
                <p>Log exercises and meals to see your calorie overview</p>
              </div>
            )}
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3>Today's Activity</h3>
              <div className="subtitle">Exercises logged today</div>
            </div>
          </div>
          {exercises.length > 0 ? (
            <div className="exercise-list">
              {exercises.map((ex) => (
                <div key={ex.id} className="exercise-item">
                  <div className={`exercise-icon-box ${ex.type}`}>
                    {ex.type === 'cardio' ? <Heart size={22} /> :
                     ex.type === 'strength' ? <Dumbbell size={22} /> :
                     <TrendingUp size={22} />}
                  </div>
                  <div className="exercise-details">
                    <div className="exercise-name">{ex.name}</div>
                    <div className="exercise-meta">{ex.duration} min · {ex.type}</div>
                  </div>
                  <div className="exercise-stats">
                    <div className="exercise-stat">
                      <div className="exercise-stat-value" style={{ color: 'var(--accent-warning)' }}>{ex.calories}</div>
                      <div className="exercise-stat-label">kcal</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Dumbbell size={48} className="empty-icon" />
              <h3>No workouts today</h3>
              <p>Head to Exercise Tracker to log your workout</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
