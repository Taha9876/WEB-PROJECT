import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, User, Stethoscope, Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await signIn(email, password);
      if (authError) throw authError;

      const role = data?.role || data?.profile?.role || 'user';

      // Validate that the user is logging into the correct portal
      if (activeTab === 'admin' && role !== 'admin') {
        setLoading(false);
        setError('This account does not have admin access.');
        return;
      }

      if (role === 'admin') navigate('/admin');
      else if (role === 'doctor') navigate('/doctor');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-icon">
              <Heart size={28} color="white" />
            </div>
            <h1>HealthTrack</h1>
            <p>Where Wellness Comes Together</p>
          </div>

          {/* Role selection tabs */}
          <div className="auth-role-tabs">
            <button className={`auth-role-tab ${activeTab === 'user' ? 'active' : ''}`} onClick={() => { setActiveTab('user'); setError(''); }}>
              <User size={16} /> User
            </button>
            <button className={`auth-role-tab ${activeTab === 'doctor' ? 'active' : ''}`} onClick={() => { setActiveTab('doctor'); setError(''); }}>
              <Stethoscope size={16} /> Doctor
            </button>
            <button className={`auth-role-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => { setActiveTab('admin'); setError(''); }}>
              <Shield size={16} /> Admin
            </button>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing In...' : `Sign In as ${activeTab === 'user' ? 'User' : activeTab === 'doctor' ? 'Doctor' : 'Admin'}`}
            </button>
          </form>

          {activeTab !== 'admin' && (
            <div className="auth-footer">
              <p>Don't have an account? <Link to={`/signup?role=${activeTab}`}>Create one</Link></p>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="auth-footer">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Admin accounts are created by existing admins only
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
