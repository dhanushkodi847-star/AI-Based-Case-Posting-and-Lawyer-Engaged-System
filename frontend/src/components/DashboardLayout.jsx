import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationTray from './NotificationTray';
import CallModal from './CallModal';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path) => {
    return location.pathname.includes(path) ? 'dash-nav-item active' : 'dash-nav-item';
  };

  const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : user.role === 'lawyer' ? '/lawyer/dashboard' : '/dashboard';

  return (
    <div className="dash-container">
      <header className="dash-header">
        <Link to="/" className="dash-logo">
          ⚖️ Legal<span>AI</span>
        </Link>
        <nav className="dash-nav">
          <Link to={dashboardPath} className={location.pathname.includes('dashboard') ? 'dash-nav-item active' : 'dash-nav-item'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Dashboard
          </Link>
          <Link to="/messages" className={isActive('/messages')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Messages
          </Link>
          <Link to="/appointments" className={isActive('/appointments')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Appointments
          </Link>
          <Link to="/profile" className={isActive('/profile')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Profile
          </Link>
          
          <NotificationTray />

          <div className="dash-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <button onClick={logout} className="dash-logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
          </button>
        </nav>
      </header>

      <main className={`dash-main ${location.pathname.includes('/admin') ? 'dash-main-admin' : ''}`}>
        <Outlet />
      </main>
      <CallModal />
    </div>
  );
};

export default DashboardLayout;
