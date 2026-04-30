import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import StatCard from '../../components/StatCard';
import { Users, Calendar, Scale, Activity } from 'lucide-react';

export default function DoctorPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    // All users who have appointments with this doctor or messaged this doctor
    const seen = new Set();
    const allPatients = [];

    const { data: appts } = await supabase
      .from('appointments')
      .select('user_id, user:profiles!appointments_user_id_fkey(id, name, email, age, weight, created_at)')
      .eq('doctor_id', user.id);

    (appts || []).forEach(a => {
      if (a.user && !seen.has(a.user_id)) { seen.add(a.user_id); allPatients.push(a.user); }
    });

    const { data: msgs } = await supabase
      .from('messages')
      .select('sender_id, sender:profiles!messages_sender_id_fkey(id, name, email, age, weight, created_at)')
      .eq('receiver_id', user.id);

    (msgs || []).forEach(m => {
      if (m.sender && !seen.has(m.sender_id)) { seen.add(m.sender_id); allPatients.push(m.sender); }
    });

    setPatients(allPatients);
  };

  const getInitials = (n) => (n || 'P').split(' ').map(w => w[0]).join('').toUpperCase();

  return (
    <>
      <Header title="My Patients" subtitle="View and manage your patient list" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={Users} label="Total Patients" value={patients.length.toString()} color="purple" />
        </div>

        <div className="content-card">
          <div className="content-card-header"><h3>Patient Directory</h3></div>
          {patients.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Patient</th><th>Email</th><th>Age</th><th>Weight</th><th>Joined</th></tr></thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="table-avatar">{getInitials(p.name)}</span>
                      {p.name || 'Unknown'}
                    </td>
                    <td>{p.email || '—'}</td>
                    <td>{p.age || '—'}</td>
                    <td>{p.weight ? `${p.weight} kg` : '—'}</td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <h3>No patients yet</h3>
              <p>Patients who book appointments or message you will appear here</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
