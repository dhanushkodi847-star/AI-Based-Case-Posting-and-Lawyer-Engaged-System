import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'sidebar-item active' : 'sidebar-item';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          ⚖️ Legal<span>AI</span>
        </Link>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-menu">
          <p className="menu-label">MENU</p>
          
          {user?.role === 'admin' && (
            <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>
              📊 Admin Panel
            </Link>
          )}

          {user?.role === 'lawyer' && (
            <>
              <Link to="/lawyer/dashboard" className={isActive('/lawyer/dashboard')}>
                📋 Matched Cases
              </Link>
              <Link to="/lawyers" className={isActive('/lawyers')}>
                🔍 Browse Lawyers
              </Link>
            </>
          )}

          {user?.role === 'client' && (
            <>
              <Link to="/cases/my" className={isActive('/cases/my')}>
                📁 My Cases
              </Link>
              <Link to="/cases/post" className={isActive('/cases/post')}>
                ➕ Post New Case
              </Link>
              <Link to="/lawyers" className={isActive('/lawyers')}>
                🔍 Find Lawyers
              </Link>
            </>
          )}
        </div>

        <div className="sidebar-menu">
           <p className="menu-label">GENERAL</p>
           <Link to="/messages" className={isActive('/messages')}>
              💬 Messages
           </Link>
           <Link to="/profile" className={isActive('/profile')}>
              👤 Profile Settings
           </Link>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={() => logout()}>
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
