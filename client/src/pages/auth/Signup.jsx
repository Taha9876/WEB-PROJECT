import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, User, Stethoscope } from 'lucide-react';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'doctor' ? 'doctor' : 'user';

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: initialRole, age: '', weight: '', height: '', specialty: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await signUp(form.email, form.password, {
        name: form.name,
        role: form.role,
        age: form.age,
        weight: form.weight,
        height: form.height,
      });
      if (authError) throw authError;

      // If doctor, update specialty
      if (form.role === 'doctor' && form.specialty && data?.user) {
        const { supabase } = await import('../../lib/supabase');
        await new Promise(resolve => setTimeout(resolve, 1500));
        await supabase.from('profiles').update({ specialty: form.specialty }).eq('id', data.user.id);
      }

      if (form.role === 'doctor') navigate('/doctor');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
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
            <p>Create Your Account</p>
          </div>

          {/* Role tabs (no admin signup) */}
          <div className="auth-role-tabs">
            <button className={`auth-role-tab ${form.role === 'user' ? 'active' : ''}`}
              onClick={() => setForm({...form, role: 'user'})}>
              <User size={16} /> User
            </button>
            <button className={`auth-role-tab ${form.role === 'doctor' ? 'active' : ''}`}
              onClick={() => setForm({...form, role: 'doctor'})}>
              <Stethoscope size={16} /> Doctor
            </button>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" className="form-input" placeholder="Your full name"
                value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password" className="form-input" placeholder="Min 6 characters"
                  value={form.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" className="form-input" placeholder="••••••••"
                  value={form.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            {form.role === 'doctor' && (
              <div className="form-group">
                <label>Specialty</label>
                <input type="text" name="specialty" className="form-input" placeholder="e.g. Nutrition & Dietetics"
                  value={form.specialty} onChange={handleChange} />
              </div>
            )}

            {form.role === 'user' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" name="age" className="form-input" placeholder="25"
                    value={form.age} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" name="weight" className="form-input" placeholder="70"
                    value={form.weight} onChange={handleChange} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating Account...' : `Sign Up as ${form.role === 'doctor' ? 'Doctor' : 'User'}`}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
