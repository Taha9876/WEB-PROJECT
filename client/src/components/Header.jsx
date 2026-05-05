import { useAuth } from '../context/AuthContext';
import { Bell, Settings, LogOut } from 'lucide-react';

export default function Header({ title }) {
  const { user, signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          margin: 0
        }}>{title}</h1>
        <p style={{
          color: 'var(--text-secondary)',
          margin: '0.5rem 0 0 0'
        }}>Welcome back, {profile?.name || user?.email}</p>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0.5rem'
        }}>
          <Bell size={24} />
        </button>
        <button style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0.5rem'
        }}>
          <Settings size={24} />
        </button>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          <LogOut size={24} />
        </button>
      </div>
    </header>
  );
}
