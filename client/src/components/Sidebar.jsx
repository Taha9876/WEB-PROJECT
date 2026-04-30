import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart, LayoutDashboard, Scale, Dumbbell, Droplets, UtensilsCrossed,
  Stethoscope, Users, BarChart3, Settings, LogOut, Shield, Menu, X
} from 'lucide-react';

const userNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/weight', icon: Scale, label: 'Weight Tracker' },
  { to: '/exercise', icon: Dumbbell, label: 'Exercise' },
  { to: '/water', icon: Droplets, label: 'Water Intake' },
  { to: '/meals', icon: UtensilsCrossed, label: 'Meal Plans' },
  { to: '/consultation', icon: Stethoscope, label: 'Doctor Consult' },
];

const doctorNavItems = [
  { to: '/doctor', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctor/patients', icon: Users, label: 'My Patients' },
  { to: '/doctor/chat', icon: Stethoscope, label: 'Patient Chat' },
  { to: '/doctor/recommendations', icon: UtensilsCrossed, label: 'Recommendations' },
];


const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = profile?.role || 'user';
  const navItems = role === 'admin' ? adminNavItems : role === 'doctor' ? doctorNavItems : userNavItems;
  const initials = (profile?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const closeSidebar = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button className="sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={closeSidebar} />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <Heart size={22} color="white" />
            </div>
            <div>
              <h2>HealthTrack</h2>
              <span>Wellness Platform</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {role === 'admin' ? 'Administration' : role === 'doctor' ? 'Doctor Portal' : 'Health Tracking'}
          </div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/admin' || item.to === '/doctor'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <item.icon size={20} className="nav-icon" />
              {item.label}
            </NavLink>
          ))}

          {role === 'user' && (
            <>
              <div className="nav-section-title" style={{ marginTop: 12 }}>Account</div>
              <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                <Settings size={20} className="nav-icon" />
                Settings
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{profile?.name || 'User'}</div>
              <div className="user-role">{role === 'user' ? 'Member' : role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
