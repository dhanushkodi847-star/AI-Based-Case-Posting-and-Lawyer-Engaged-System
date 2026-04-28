import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const CallModal = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      
      // Play a small notification sound if possible
      try {
        const audio = new Audio('/call-ring.mp3'); 
        audio.play().catch(e => console.log('Audio play failed', e));
      } catch (e) {}
    };

    socket.on('incomingCall', handleIncomingCall);

    return () => {
      socket.off('incomingCall', handleIncomingCall);
    };
  }, [socket]);

  const acceptCall = () => {
    const { appointmentId } = incomingCall;
    setIncomingCall(null);
    navigate(`/video-call/${appointmentId}`);
  };

  const declineCall = () => {
    setIncomingCall(null);
    // Optionally notify the other user
  };

  if (!incomingCall) return null;

  return (
    <div style={{ 
      position: 'fixed', top: '96px', right: '24px', width: '320px', 
      background: '#1E293B', borderRadius: '1rem', border: '1px solid #D9A05B', 
      padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', zIndex: 9999,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#D9A05B', color: '#0A0F1D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800' }}>
          {incomingCall.name.charAt(0)}
        </div>
        <div>
          <h4 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Incoming Video Call</h4>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>{incomingCall.name} is calling...</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button 
          onClick={acceptCall}
          style={{ flex: 1, padding: '0.7rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
        >
          Accept
        </button>
        <button 
          onClick={declineCall}
          style={{ flex: 1, padding: '0.7rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer' }}
        >
          Decline
        </button>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CallModal;
