import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import { Send, MessageCircle, Calendar, X, Plus } from 'lucide-react';

export default function Consultation() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDoc, setBookingDoc] = useState(null);
  const [bookingForm, setBookingForm] = useState({ date: '', time: '10:00', type: 'General Consultation', notes: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    if (!selectedDoctor || !user) return;
    fetchMessages();

    const channel = supabase
      .channel('consultation_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === user.id && msg.receiver_id === selectedDoctor.id) ||
            (msg.sender_id === selectedDoctor.id && msg.receiver_id === user.id)) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDoctor, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDoctors = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'doctor').order('name');
    setDoctors(data || []);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedDoctor.id}),and(sender_id.eq.${selectedDoctor.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedDoctor) return;
    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selectedDoctor.id, text: newMessage.trim() });
    setNewMessage('');
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    const appointmentDate = `${bookingForm.date}T${bookingForm.time}:00`;
    await supabase.from('appointments').insert({
      user_id: user.id,
      doctor_id: bookingDoc.id,
      appointment_date: appointmentDate,
      type: bookingForm.type,
      notes: bookingForm.notes,
      status: 'Pending',
    });
    setBookingSuccess(true);
    setTimeout(() => { setShowBooking(false); setBookingSuccess(false); setBookingForm({ date: '', time: '10:00', type: 'General Consultation', notes: '' }); }, 1500);
  };

  const getInitials = (n) => (n || 'D').split(' ').map(w => w[0]).join('').toUpperCase();

  // Get tomorrow's date as min date for booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <>
      <Header title="Doctor Consultation" subtitle="Book appointments and chat with doctors" />
      <div className="page-content">
        {!selectedDoctor ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 4 }}>Available Doctors</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Book an appointment or start a chat for personalized health guidance</p>
            </div>
            {doctors.length > 0 ? (
              <div className="doctor-grid">
                {doctors.map(doc => (
                  <div key={doc.id} className="doctor-card">
                    <div className="doctor-avatar">{getInitials(doc.name)}</div>
                    <div className="doctor-name">{doc.name}</div>
                    <div className="doctor-specialty">{doc.specialty || 'General'}</div>
                    <div className="doctor-availability">🟢 Available</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setSelectedDoctor(doc)}>
                        <MessageCircle size={14} /> Chat
                      </button>
                      <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => { setBookingDoc(doc); setShowBooking(true); }}>
                        <Calendar size={14} /> Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <MessageCircle size={48} className="empty-icon" />
                <h3>No doctors registered yet</h3>
                <p>Doctors can sign up to appear here</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedDoctor(null); setMessages([]); }}>← Back</button>
              <div className="doctor-avatar" style={{ width: 44, height: 44, margin: 0, fontSize: '0.9rem' }}>{getInitials(selectedDoctor.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{selectedDoctor.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary-light)' }}>{selectedDoctor.specialty || 'General'}</div>
              </div>
              <button className="btn btn-success btn-sm" onClick={() => { setBookingDoc(selectedDoctor); setShowBooking(true); }}>
                <Calendar size={14} /> Book Appointment
              </button>
            </div>

            <div className="chat-container" style={{ height: 'calc(100vh - 260px)' }}>
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="empty-state" style={{ padding: 40 }}>
                    <MessageCircle size={36} className="empty-icon" />
                    <h3>Start the conversation</h3>
                    <p>Send a message to begin your consultation</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`chat-message ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                    {msg.text}
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-area">
                <input type="text" placeholder="Type your message..."
                  value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend}><Send size={18} /></button>
              </div>
            </div>
          </>
        )}

        {/* Booking Modal */}
        {showBooking && bookingDoc && (
          <div className="modal-overlay" onClick={() => { setShowBooking(false); setBookingSuccess(false); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Book Appointment</h2>
                <button className="modal-close" onClick={() => { setShowBooking(false); setBookingSuccess(false); }}><X size={18} /></button>
              </div>

              {bookingSuccess ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                  <h3 style={{ marginBottom: 8 }}>Appointment Booked!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Your appointment with Dr. {bookingDoc.name} has been scheduled</p>
                </div>
              ) : (
                <form className="modal-form" onSubmit={handleBookAppointment}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: 4 }}>
                    <div className="doctor-avatar" style={{ width: 44, height: 44, margin: 0, fontSize: '0.9rem' }}>{getInitials(bookingDoc.name)}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{bookingDoc.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary-light)' }}>{bookingDoc.specialty || 'General'}</div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Appointment Date</label>
                    <input type="date" className="form-input" min={minDate}
                      value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Time</label>
                      <select className="form-select" value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})}>
                        {['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select className="form-select" value={bookingForm.type} onChange={e => setBookingForm({...bookingForm, type: e.target.value})}>
                        <option>General Consultation</option>
                        <option>Diet Planning</option>
                        <option>Fitness Review</option>
                        <option>Follow-Up</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes (Optional)</label>
                    <textarea className="form-input" placeholder="Describe your health concern..." rows={3}
                      value={bookingForm.notes} onChange={e => setBookingForm({...bookingForm, notes: e.target.value})} style={{ resize: 'vertical' }} />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowBooking(false)} style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Confirm Booking</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
