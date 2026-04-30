import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { Users, Calendar, MessageCircle, Clock } from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();

    const channel = supabase
      .channel('doctor_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    // Fetch appointments for this doctor
    const { data: appts } = await supabase
      .from('appointments')
      .select('*, user:profiles!appointments_user_id_fkey(name, email)')
      .eq('doctor_id', user.id)
      .order('appointment_date', { ascending: true });
    setAppointments(appts || []);

    // Fetch unique patients from messages AND appointments
    const seen = new Set();
    const uniquePatients = [];

    // From messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('sender_id, sender:profiles!messages_sender_id_fkey(id, name, email, age)')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });
    (msgs || []).forEach(m => {
      if (m.sender && !seen.has(m.sender_id)) {
        seen.add(m.sender_id);
        uniquePatients.push(m.sender);
      }
    });

    // From appointments (patients who booked but may not have messaged)
    (appts || []).forEach(a => {
      if (a.user && !seen.has(a.user_id)) {
        seen.add(a.user_id);
        uniquePatients.push({ ...a.user, age: null });
      }
    });

    setPatients(uniquePatients);

    // Count unread (simple: messages received today)
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id);
    setUnreadCount(count || 0);

    setLoading(false);
  };

  return (
    <>
      <Header title="Doctor Portal" subtitle="Manage your patients and consultations" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={Users} label="Patients" value={patients.length.toString()} color="purple" />
          <StatCard icon={Calendar} label="Appointments" value={appointments.length.toString()} color="blue" />
          <StatCard icon={MessageCircle} label="Messages" value={unreadCount.toString()} color="orange" />
        </div>

        <div className="two-col-grid">
          <div className="content-card">
            <div className="content-card-header">
              <div>
                <h3>Appointments</h3>
                <div className="subtitle">Upcoming and recent</div>
              </div>
            </div>
            {appointments.length > 0 ? (
              <div className="exercise-list">
                {appointments.map(apt => (
                  <div key={apt.id} className="exercise-item">
                    <div className="exercise-icon-box" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary-light)' }}>
                      <Clock size={22} />
                    </div>
                    <div className="exercise-details">
                      <div className="exercise-name">{apt.user?.name || 'Patient'}</div>
                      <div className="exercise-meta">
                        {new Date(apt.appointment_date).toLocaleDateString()} · {apt.type}
                      </div>
                    </div>
                    <span className={`badge-status ${apt.status === 'Confirmed' ? 'badge-active' : apt.status === 'Completed' ? 'badge-completed' : 'badge-pending'}`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Calendar size={48} className="empty-icon" />
                <h3>No appointments yet</h3>
                <p>Appointments will appear here when patients book</p>
              </div>
            )}
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <div>
                <h3>Patients</h3>
                <div className="subtitle">Users who've contacted you</div>
              </div>
            </div>
            {patients.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr><th>Patient</th><th>Email</th></tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id}>
                      <td>
                        <span className="table-avatar">{(p.name || 'P')[0]}</span>
                        {p.name || 'Unknown'}
                      </td>
                      <td>{p.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <Users size={48} className="empty-icon" />
                <h3>No patients yet</h3>
                <p>Patients will appear here when they contact you</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
