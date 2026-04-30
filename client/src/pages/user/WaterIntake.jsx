import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { Droplets, Target, TrendingUp } from 'lucide-react';

export default function WaterIntake() {
  const { user, profile } = useAuth();
  const [glasses, setGlasses] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const GOAL = profile?.water_goal || 8;
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    fetchWater();
    fetchWeekly();

    const channel = supabase
      .channel('water_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_intake', filter: `user_id=eq.${user.id}` }, () => {
        fetchWater();
        fetchWeekly();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchWater = async () => {
    const { data } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();
    setGlasses(data?.glasses || 0);
    setLoading(false);
  };

  const fetchWeekly = async () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const { data } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', user.id)
      .in('date', days);

    const mapped = days.map(day => ({
      day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
      count: (data || []).find(d => d.date === day)?.glasses || 0,
    }));
    setWeeklyData(mapped);
  };

  const updateGlasses = async (newCount) => {
    setGlasses(newCount);

    // Upsert: insert or update today's record
    const { data: existing } = await supabase
      .from('water_intake')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase.from('water_intake').update({ glasses: newCount }).eq('id', existing.id);
    } else {
      await supabase.from('water_intake').insert({ user_id: user.id, glasses: newCount, date: today });
    }
  };

  const toggleGlass = (i) => {
    const newCount = i + 1 <= glasses ? i : i + 1;
    updateGlasses(newCount);
  };

  const percentage = Math.round((glasses / GOAL) * 100);
  const circumference = 2 * Math.PI * 52;
  const dashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const weeklyAvg = weeklyData.length > 0
    ? (weeklyData.reduce((s, d) => s + d.count, 0) / weeklyData.filter(d => d.count > 0).length || 0).toFixed(1)
    : '0';

  return (
    <>
      <Header title="Water Intake" subtitle="Stay hydrated throughout the day" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={Droplets} label="Today's Intake" value={`${glasses} glasses`} change={`${percentage}%`} color="blue" />
          <StatCard icon={Target} label="Daily Goal" value={`${GOAL} glasses`} color="purple" />
          <StatCard icon={TrendingUp} label="Weekly Average" value={weeklyAvg} color="green" />
        </div>

        <div className="two-col-grid">
          <div className="content-card">
            <div className="content-card-header">
              <h3>Track Your Water</h3>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div className="progress-ring" style={{ width: 160, height: 160, margin: '0 auto 16px' }}>
                <svg width="160" height="160">
                  <circle className="progress-ring-bg" cx="80" cy="80" r="52" />
                  <circle className="progress-ring-fill" cx="80" cy="80" r="52"
                    stroke="var(--accent-secondary)" strokeDasharray={circumference}
                    strokeDashoffset={dashoffset} />
                </svg>
                <div className="progress-ring-text">
                  <span className="progress-ring-value" style={{ color: 'var(--accent-secondary)', fontSize: '2rem' }}>{Math.min(percentage, 100)}%</span>
                  <span className="progress-ring-label">of goal</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {glasses >= GOAL ? '🎉 Goal reached! Great job!' : `${GOAL - glasses} more glasses to go`}
              </p>
            </div>
            <div className="water-grid">
              {Array.from({ length: GOAL }).map((_, i) => (
                <div key={i} className={`water-glass ${i < glasses ? 'filled' : ''}`} onClick={() => toggleGlass(i)}>
                  <Droplets size={24} className="glass-icon" color={i < glasses ? 'var(--accent-secondary)' : 'var(--text-muted)'} />
                  <span className="glass-label">{(i + 1) * 250}ml</span>
                </div>
              ))}
            </div>
            <div className="water-progress" style={{ marginTop: 16 }}>
              <div className="water-progress-bar">
                <div className="water-progress-fill" style={{ width: `${Math.min(percentage, 100)}%` }} />
              </div>
              <div className="water-progress-text">{glasses}/{GOAL}</div>
            </div>
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <h3>Weekly Overview</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {weeklyData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 36, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{d.day}</span>
                  <div style={{ flex: 1, height: 28, background: 'rgba(6,182,212,0.08)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 8, transition: 'width 0.5s ease',
                      width: `${Math.min((d.count / GOAL) * 100, 100)}%`,
                      background: d.count >= GOAL ? 'var(--gradient-secondary)' : 'linear-gradient(90deg, rgba(6,182,212,0.3) 0%, rgba(6,182,212,0.6) 100%)'
                    }} />
                  </div>
                  <span style={{ width: 40, fontSize: '0.85rem', fontWeight: 700, color: d.count >= GOAL ? 'var(--accent-secondary)' : 'var(--text-secondary)', textAlign: 'right' }}>
                    {d.count}/{GOAL}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, padding: 20, background: 'rgba(6,182,212,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6,182,212,0.15)' }}>
              <h4 style={{ marginBottom: 8, color: 'var(--accent-secondary)' }}>💡 Hydration Tips</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Drink a glass of water right after waking up</li>
                <li>Keep a water bottle at your desk</li>
                <li>Set reminders every 2 hours</li>
                <li>Eat water-rich fruits like watermelon</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
