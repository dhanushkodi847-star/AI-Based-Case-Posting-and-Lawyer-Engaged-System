import { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: '#10B981',
    error: '#EF4444',
    info: '#D9A05B',
    warning: '#F59E0B'
  }[type];

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      background: bgColor,
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      zIndex: 9999,
      fontWeight: '700',
      animation: visible ? 'slideIn 0.3s ease-out forwards' : 'slideOut 0.3s ease-in forwards',
      fontSize: '0.95rem'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
      <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : '🔔'}</span>
      {message}
    </div>
  );
};

export default Toast;
