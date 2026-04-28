import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { IoNotificationsOutline, IoCheckmarkDoneOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const NotificationTray = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const toggleTray = () => setIsOpen(!isOpen);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={toggleTray}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: unreadCount > 0 ? '#D9A05B' : 'white', 
          cursor: 'pointer', 
          padding: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          position: 'relative',
          transition: 'all 0.2s'
        }}
      >
        <IoNotificationsOutline size={22} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', 
            top: '2px', 
            right: '2px', 
            background: '#EF4444', 
            color: 'white', 
            fontSize: '0.65rem', 
            fontWeight: '900', 
            padding: '2px 5px', 
            borderRadius: '1rem',
            minWidth: '18px',
            textAlign: 'center',
            boxShadow: '0 0 5px rgba(239, 68, 68, 0.5)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)} 
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          />
          <div style={{ 
            position: 'absolute', 
            top: '100%', 
            right: 0, 
            width: '350px', 
            maxHeight: '450px', 
            background: '#1E293B', 
            borderRadius: '1rem', 
            marginTop: '1rem', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            zIndex: 100, 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'white' }}>Notifications</h4>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  style={{ background: 'transparent', border: 'none', color: '#D9A05B', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <IoCheckmarkDoneOutline /> Mark all read
                </button>
              )}
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif._id} 
                    onClick={() => { 
                      if (!notif.isRead) markAsRead(notif._id); 
                    }}
                    style={{ 
                      padding: '1rem 1.25rem', 
                      borderBottom: '1px solid rgba(255,255,255,0.03)', 
                      background: notif.isRead ? 'transparent' : 'rgba(217, 160, 91, 0.05)',
                      cursor: notif.link ? 'pointer' : 'default',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '700', color: notif.isRead ? '#94A3B8' : 'white', fontSize: '0.9rem' }}>{notif.title}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.4' }}>{notif.message}</p>
                    {notif.link && (
                      <Link 
                        to={notif.link} 
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        style={{ display: 'inline-block', marginTop: '0.5rem', color: '#D9A05B', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none' }}
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>End of recent notifications</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationTray;
