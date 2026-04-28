const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  const accentColor = type === 'danger' ? '#EF4444' : '#10B981';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 10000, padding: '1rem'
    }}>
      <div style={{
        background: '#0F172A', padding: '2.5rem', borderRadius: '24px',
        width: '100%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', background: `${accentColor}15`,
          color: accentColor, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
          fontSize: '1.75rem', border: `1px solid ${accentColor}30`
        }}>
          {type === 'danger' ? '⚠️' : '❓'}
        </div>
        
        <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.75rem', fontWeight: '800' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.6' }}>{message}</p>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={onCancel} 
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.85rem', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            style={{ flex: 1, background: accentColor, border: 'none', color: 'white', padding: '0.85rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: `0 4px 15px ${accentColor}40` }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
