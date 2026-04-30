import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import { Calendar, CheckCircle, XCircle, Clock, User, Filter } from 'lucide-react';

export default function DoctorAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAppointments();

    const ch = supabase.channel('doc_appts_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${user.id}` }, () => fetchAppointments())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:profiles!appointments_user_id_fkey(name, email)')
      .eq('doctor_id', user.id)
      .order('appointment_date', { ascending: true });

    if (error) console.error('Error fetching appointments:', error);
    setAppointments(data || []);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment: ' + error.message);
      return;
    }
    fetchAppointments();
  };

  const getInitials = (n) => (n || 'P').split(' ').map(w => w[0]).join('').toUpperCase();

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status?.toLowerCase() === filter.toLowerCase());

  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'Pending').length,
    confirmed: appointments.filter(a => a.status === 'Confirmed').length,
    cancelled: appointments.filter(a => a.status === 'Cancelled').length,
    completed: appointments.filter(a => a.status === 'Completed').length,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed': return 'badge-active';
      case 'Completed': return 'badge-completed';
      case 'Cancelled': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      <Header title="Appointments" subtitle="Manage patient appointment requests" />
      <div className="page-content">
        {/* Filter Tabs */}
        <div className="appointment-filters">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Appointments List */}
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3>{filter === 'all' ? 'All Appointments' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}</h3>
              <div className="subtitle">{filtered.length} appointment{filtered.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loader"></div>
              <p>Loading appointments...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="exercise-list">
              {filtered.map(apt => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-main">
                    <div className="exercise-icon-box" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary-light)' }}>
                      <Calendar size={22} />
                    </div>
                    <div className="exercise-details">
                      <div className="exercise-name">{apt.patient?.name || 'Patient'}</div>
                      <div className="exercise-meta">
                        {apt.patient?.email}
                      </div>
                      <div className="appointment-info">
                        <span className="appointment-date">
                          <Calendar size={13} /> {formatDate(apt.appointment_date)}
                        </span>
                        <span className="appointment-time">
                          <Clock size={13} /> {formatTime(apt.appointment_date)}
                        </span>
                        <span className="appointment-type">{apt.type}</span>
                      </div>
                      {apt.notes && (
                        <div className="appointment-notes">
                          <strong>Notes:</strong> {apt.notes}
                        </div>
                      )}
                    </div>
                    <div className="appointment-actions-area">
                      <span className={`badge-status ${getStatusBadge(apt.status)}`}>
                        {apt.status}
                      </span>
                      {apt.status === 'Pending' && (
                        <div className="appointment-actions">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => updateStatus(apt.id, 'Confirmed')}
                            title="Approve"
                          >
                            <CheckCircle size={15} /> Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => updateStatus(apt.id, 'Cancelled')}
                            title="Reject"
                          >
                            <XCircle size={15} /> Reject
                          </button>
                        </div>
                      )}
                      {apt.status === 'Confirmed' && (
                        <div className="appointment-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => updateStatus(apt.id, 'Completed')}
                            title="Mark Complete"
                          >
                            <CheckCircle size={15} /> Complete
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => updateStatus(apt.id, 'Cancelled')}
                            title="Cancel"
                          >
                            <XCircle size={15} /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Calendar size={48} className="empty-icon" />
              <h3>No {filter !== 'all' ? filter : ''} appointments</h3>
              <p>
                {filter === 'pending'
                  ? 'No pending appointment requests right now'
                  : 'Appointments will appear here when patients book them'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
