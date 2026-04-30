import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import { Send, MessageCircle, Users } from 'lucide-react';

export default function DoctorChat() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchPatients();
  }, [user]);

  useEffect(() => {
    if (!selectedPatient || !user) return;
    fetchMessages();

    const channel = supabase
      .channel('doctor_chat_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === user.id && msg.receiver_id === selectedPatient.id) ||
            (msg.sender_id === selectedPatient.id && msg.receiver_id === user.id)) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedPatient, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchPatients = async () => {
    // Get unique patients who sent messages to this doctor
    const { data: msgs } = await supabase
      .from('messages')
      .select('sender_id, sender:profiles!messages_sender_id_fkey(id, name, email)')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    const seen = new Set();
    const unique = (msgs || [])
      .filter(m => { if (seen.has(m.sender_id)) return false; seen.add(m.sender_id); return true; })
      .map(m => m.sender);

    // Also get patients who this doctor has sent messages to
    const { data: sentMsgs } = await supabase
      .from('messages')
      .select('receiver_id, receiver:profiles!messages_receiver_id_fkey(id, name, email)')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    (sentMsgs || []).forEach(m => {
      if (!seen.has(m.receiver_id)) {
        seen.add(m.receiver_id);
        unique.push(m.receiver);
      }
    });

    setPatients(unique.filter(Boolean));
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedPatient.id}),and(sender_id.eq.${selectedPatient.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPatient) return;
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedPatient.id,
      text: newMessage.trim(),
    });
    setNewMessage('');
  };

  const getInitials = (n) => (n || 'P').split(' ').map(w => w[0]).join('').toUpperCase();

  return (
    <>
      <Header title="Patient Chat" subtitle="Communicate with your patients" />
      <div className="page-content">
        <div className="doctor-chat-layout">
          {/* Patient list */}
          <div className="content-card doctor-chat-sidebar">
            <div className="content-card-header" style={{ marginBottom: 12 }}>
              <h3>Patients</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {patients.length > 0 ? patients.map(p => (
                <div key={p.id} onClick={() => setSelectedPatient(p)}
                  className="nav-item" style={{
                    cursor: 'pointer', padding: '10px 12px',
                    background: selectedPatient?.id === p.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                    borderColor: selectedPatient?.id === p.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                  }}>
                  <div className="table-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem', margin: 0 }}>{getInitials(p.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.email}</div>
                  </div>
                </div>
              )) : (
                <div className="empty-state" style={{ padding: 20 }}>
                  <Users size={32} className="empty-icon" />
                  <p style={{ fontSize: '0.8rem' }}>No patient conversations yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="content-card doctor-chat-main">
            {selectedPatient ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-color)', marginBottom: 16 }}>
                  <div className="table-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem', margin: 0 }}>{getInitials(selectedPatient.name)}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{selectedPatient.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedPatient.email}</div>
                  </div>
                </div>

                <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
                  {messages.length === 0 && (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <MessageCircle size={36} className="empty-icon" />
                      <h3>No messages yet</h3>
                      <p>Send a message to start the consultation</p>
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

                <div className="chat-input-area" style={{ padding: '16px 0 0', border: 'none', borderTop: '1px solid var(--border-color)' }}>
                  <input type="text" placeholder="Type your reply..."
                    value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()} />
                  <button onClick={handleSend}><Send size={18} /></button>
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={56} className="empty-icon" />
                <h3>Select a patient</h3>
                <p>Choose a patient from the left to view conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
