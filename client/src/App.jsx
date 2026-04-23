import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/user/Dashboard';
import WeightTracker from './pages/user/WeightTracker';
import ExerciseTracker from './pages/user/ExerciseTracker';
import WaterIntake from './pages/user/WaterIntake';
import MealPlan from './pages/user/MealPlan';
import Consultation from './pages/user/Consultation';
import Settings from './pages/user/Settings';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorChat from './pages/doctor/DoctorChat';
import DoctorRecommendations from './pages/doctor/DoctorRecommendations';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import './App.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(profile?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, profile } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={profile?.role === 'admin' ? '/admin' : profile?.role === 'doctor' ? '/doctor' : '/dashboard'} /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />

      {/* User Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/weight" element={<ProtectedRoute><AppLayout><WeightTracker /></AppLayout></ProtectedRoute>} />
      <Route path="/exercise" element={<ProtectedRoute><AppLayout><ExerciseTracker /></AppLayout></ProtectedRoute>} />
      <Route path="/water" element={<ProtectedRoute><AppLayout><WaterIntake /></AppLayout></ProtectedRoute>} />
      <Route path="/meals" element={<ProtectedRoute><AppLayout><MealPlan /></AppLayout></ProtectedRoute>} />
      <Route path="/consultation" element={<ProtectedRoute><AppLayout><Consultation /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

      {/* Doctor Routes */}
      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><AppLayout><DoctorDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor']}><AppLayout><DoctorPatients /></AppLayout></ProtectedRoute>} />
      <Route path="/doctor/chat" element={<ProtectedRoute allowedRoles={['doctor']}><AppLayout><DoctorChat /></AppLayout></ProtectedRoute>} />
      <Route path="/doctor/recommendations" element={<ProtectedRoute allowedRoles={['doctor']}><AppLayout><DoctorRecommendations /></AppLayout></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminUsers /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminReports /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminSettings /></AppLayout></ProtectedRoute>} />

      {/* Default */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
