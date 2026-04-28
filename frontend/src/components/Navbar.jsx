import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { IoNotificationsOutline } from 'react-icons/io5';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) markAsRead(n._id);
    setShowNotifications(false);
    if (n.link) navigate(n.link);
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          ⚖️ Legal<span>AI</span>
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              {/* Notification Bell */}
              <div style={{ position: 'relative' }} ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', position: 'relative', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                >
                  <IoNotificationsOutline size={22} />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#EF4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{ 
                    position: 'absolute', top: '100%', right: '0', width: '320px', background: '#121A2F', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 1000, marginTop: '0.75rem', overflow: 'hidden' 
                  }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>Notifications</h4>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#D9A05B', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Mark all read</button>
                      )}
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No notifications yet</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n._id} 
                            onClick={() => handleNotificationClick(n)}
                            style={{ 
                              padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'background 0.2s', background: n.isRead ? 'transparent' : 'rgba(217, 160, 91, 0.03)' 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(217, 160, 91, 0.03)'}
                          >
                            <p style={{ margin: '0 0 0.25rem 0', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.85rem' }}>{n.title}</p>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: '1.4' }}>{n.message}</p>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Common Links */}
              <Link to="/profile">Profile</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/appointments">Schedule</Link>
              <Link to="/payments">Payments</Link>
              <Link to="/documents">Documents</Link>

              {/* Client Links */}
              {user.role === 'client' && (
                <>
                  <Link to="/cases/my">My Cases</Link>
                  <Link to="/cases/post" className="nav-btn primary-btn">Post Case</Link>
                </>
              )}

              {/* Lawyer Links */}
              {user.role === 'lawyer' && (
                <>
                  <Link to="/lawyer/dashboard">Dashboard</Link>
                  <Link to="/lawyers">Browse Lawyers</Link>
                </>
              )}

              {/* Admin Links */}
              {user.role === 'admin' && (
                <Link to="/admin/dashboard">Admin Panel</Link>
              )}

              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="nav-btn primary-btn">Get Started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
