import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoMicOutline, IoMicOffOutline, IoVideocamOutline, IoVideocamOffOutline, IoCall, IoExpandOutline, IoContractOutline, IoChatbubbleOutline } from 'react-icons/io5';
import { MdScreenShare, MdStopScreenShare } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const VideoCall = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('initializing');
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paymentBlocked, setPaymentBlocked] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef();
  const containerRef = useRef();
  const timerRef = useRef();

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await api.get(`/appointments/${appointmentId}`);
        const appt = res.data.data;

        // Block access if online appointment is unpaid
        if (appt.type === 'online' && appt.paymentStatus !== 'paid' && user.role !== 'admin') {
          setPaymentBlocked(true);
          return;
        }

        let other;
        if (user.role === 'admin') {
          other = appt.lawyer;
        } else {
          other = user.role === 'lawyer' ? appt.client : appt.lawyer;
        }
        setOtherUser(other);
      } catch (err) {
        showToast('Failed to load call details', 'error');
      }
    };

    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCallStatus('ready');
      } catch (err) {
        showToast('Camera/Microphone access denied. Please check permissions.', 'error');
        console.error(err);
      }
    };

    fetchAppointment();
    startMedia();

    if (socket) {
      socket.emit('joinVideoRoom', appointmentId);
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      clearInterval(timerRef.current);
    };
  }, [appointmentId, socket]);

  useEffect(() => {
    if (!socket || !localStream || !otherUser) return;

    socket.on('incomingCall', async (data) => {
      if (data.appointmentId !== appointmentId) return;

      setCallStatus('connected');
      await createPeerConnection(data.from);

      localStream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, localStream);
      });

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit('answerCall', {
        to: data.from,
        signal: answer
      });
    });

    socket.on('callAccepted', async (signal) => {
      setCallStatus('connected');
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
    });

    socket.on('iceCandidate', async (candidate) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error('Error adding ice candidate', e);
      }
    });

    socket.on('endCall', () => {
      handleEndCall(false);
    });

    return () => {
      socket.off('incomingCall');
      socket.off('callAccepted');
      socket.off('iceCandidate');
      socket.off('endCall');
    };
  }, [socket, localStream, otherUser, appointmentId]);

  const createPeerConnection = async (targetUserId) => {
    peerConnection.current = new RTCPeerConnection(servers);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', {
          candidate: event.candidate,
          to: targetUserId
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
  };

  const initiateCall = async () => {
    if (!otherUser) return;
    setCallStatus('calling');
    await createPeerConnection(otherUser._id);

    localStream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream);
    });

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit('callUser', {
      userToCall: otherUser._id,
      signalData: offer,
      from: user._id,
      name: user.name,
      appointmentId: appointmentId
    });
  };

  const handleEndCall = (emit = true) => {
    if (emit && socket && otherUser) {
      socket.emit('endCall', { to: otherUser._id });
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    clearInterval(timerRef.current);
    setCallStatus('ended');
    showToast('Call ended', 'info');
    navigate('/appointments');
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Payment gate — block unpaid access
  if (paymentBlocked) {
    return (
      <div style={{
        height: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#040712',
        borderRadius: '1.5rem',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>💳</div>
          <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.75rem' }}>
            Payment Required
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            You need to pay the consultation fee before joining this video call. Please complete the payment from your appointments page.
          </p>
          <button
            onClick={() => navigate('/appointments')}
            style={{
              padding: '1rem 2.5rem',
              background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)',
              color: '#0A0F1D',
              border: 'none',
              borderRadius: '3rem',
              fontWeight: '800',
              fontSize: '1.05rem',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(217, 160, 91, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            Go to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: 'calc(100vh - 80px)',
        minHeight: '550px',
        display: 'flex',
        flexDirection: 'column',
        background: '#040712',
        borderRadius: isFullscreen ? '0' : '1.5rem',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.05)'
      }}
    >

      {/* Top Bar — Status + Timer */}
      {callStatus === 'connected' && (
        <div style={{
          position: 'absolute',
          top: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 1.25rem',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          borderRadius: '2rem',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 8px #10B981',
            animation: 'pulse-dot 2s infinite'
          }} />
          <span style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.04em' }}>
            {formatDuration(callDuration)}
          </span>
          <span style={{ color: '#64748B', fontSize: '0.8rem' }}>• Encrypted</span>
        </div>
      )}

      {/* Video Area */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>

        {/* Main Video — Remote or Waiting Panel */}
        {remoteStream ? (
          <div style={{
            width: '100%', height: '100%',
            borderRadius: '1.25rem',
            overflow: 'hidden',
            position: 'relative',
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: '1rem', left: '1rem',
              background: 'rgba(0,0,0,0.55)', padding: '0.4rem 0.9rem',
              borderRadius: '0.6rem', color: 'white', fontSize: '0.8rem',
              fontWeight: '600', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981' }} />
              {otherUser?.name || 'Participant'}
            </div>
          </div>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, #0F1629 0%, #040712 70%)',
            borderRadius: '1.25rem',
            gap: '1.5rem',
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
            {otherUser && (
              <div style={{ textAlign: 'center' }}>
                {/* Animated ring around avatar */}
                <div style={{
                  position: 'relative',
                  width: '130px', height: '130px',
                  margin: '0 auto 1.75rem'
                }}>
                  {callStatus === 'calling' && (
                    <div style={{
                      position: 'absolute', inset: '-8px',
                      borderRadius: '50%',
                      border: '3px solid rgba(16, 185, 129, 0.3)',
                      animation: 'ring-pulse 1.5s ease-out infinite'
                    }} />
                  )}
                  <div style={{
                    width: '130px', height: '130px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D9A05B 0%, #B47B3E 100%)',
                    color: '#0A0F1D',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3rem', fontWeight: '800',
                    boxShadow: '0 15px 40px rgba(217, 160, 91, 0.25)'
                  }}>
                    {otherUser.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h2 style={{
                  margin: '0 0 0.3rem 0', fontSize: '1.8rem',
                  letterSpacing: '-0.02em', color: 'white', fontWeight: '700'
                }}>
                  {otherUser.name}
                </h2>
                <p style={{ color: '#64748B', fontSize: '1rem', margin: 0 }}>
                  {user.role === 'lawyer' ? 'Client' : 'Counsel'}
                </p>
              </div>
            )}

            {callStatus === 'ready' && (
              <>
                <button
                  onClick={initiateCall}
                  style={{
                    padding: '1rem 2.5rem',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '1.05rem',
                    boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    marginTop: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 14px 35px -5px rgba(16, 185, 129, 0.55)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(16, 185, 129, 0.45)';
                  }}
                >
                  <IoCall size={22} /> Start Call
                </button>
                <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                  The other party will be notified once you start the call
                </p>
              </>
            )}

            {callStatus === 'calling' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontSize: '1.1rem', fontWeight: '600', color: '#94A3B8',
                  margin: '0 0 0.75rem'
                }}>
                  Calling {otherUser?.name}...
                </p>
                <button
                  onClick={() => handleEndCall(true)}
                  style={{
                    color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    fontWeight: '600', cursor: 'pointer',
                    padding: '0.6rem 1.5rem', borderRadius: '2rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Self-View — Picture-in-Picture (bottom right) */}
        <div style={{
          position: 'absolute',
          bottom: '6.5rem',
          right: '1.75rem',
          width: '240px',
          height: '160px',
          borderRadius: '1rem',
          overflow: 'hidden',
          background: '#111827',
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
          zIndex: 40,
          transition: 'all 0.3s ease'
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: 'scaleX(-1)'
            }}
          />
          {isVideoOff && (
            <div style={{
              position: 'absolute', inset: 0,
              background: '#111827',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748B', fontSize: '0.85rem', fontWeight: '600'
            }}>
              Camera Off
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: '0.5rem', left: '0.5rem',
            background: 'rgba(0,0,0,0.6)',
            padding: '0.2rem 0.5rem',
            borderRadius: '0.3rem',
            color: 'white', fontSize: '0.65rem', fontWeight: '600'
          }}>
            You
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 2rem',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '4rem',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        zIndex: 50
      }}>
        {/* Mic Toggle */}
        <ControlButton
          onClick={toggleMute}
          active={!isMuted}
          danger={isMuted}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <IoMicOffOutline size={20} /> : <IoMicOutline size={20} />}
        </ControlButton>

        {/* Video Toggle */}
        <ControlButton
          onClick={toggleVideo}
          active={!isVideoOff}
          danger={isVideoOff}
          title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
        >
          {isVideoOff ? <IoVideocamOffOutline size={20} /> : <IoVideocamOutline size={20} />}
        </ControlButton>

        {/* Divider */}
        <div style={{
          width: '1px', height: '32px',
          background: 'rgba(255,255,255,0.1)'
        }} />

        {/* End Call */}
        <button
          onClick={() => handleEndCall(true)}
          title="End Call"
          style={{
            width: '60px',
            height: '44px',
            borderRadius: '2rem',
            border: 'none',
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.55)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
          }}
        >
          <IoCall size={22} style={{ transform: 'rotate(135deg)' }} />
        </button>

        {/* Divider */}
        <div style={{
          width: '1px', height: '32px',
          background: 'rgba(255,255,255,0.1)'
        }} />

        {/* Fullscreen */}
        <ControlButton
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <IoContractOutline size={20} /> : <IoExpandOutline size={20} />}
        </ControlButton>
      </div>

      {/* Initializing Overlay */}
      {callStatus === 'initializing' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#040712',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: '1.5rem', width: '50px', height: '50px' }} />
            <p style={{
              color: 'white', fontSize: '1.25rem', fontWeight: '600',
              letterSpacing: '-0.01em', margin: '0 0 0.4rem'
            }}>
              Connecting to Secure Server...
            </p>
            <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>
              Setting up end-to-end encryption
            </p>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

/* Reusable Control Button Component */
const ControlButton = ({ onClick, active, danger, title, children }) => {
  const [hovered, setHovered] = useState(false);

  const bg = danger
    ? 'rgba(239, 68, 68, 0.2)'
    : hovered
      ? 'rgba(255,255,255,0.15)'
      : 'rgba(255,255,255,0.07)';

  const borderColor = danger
    ? 'rgba(239, 68, 68, 0.35)'
    : hovered
      ? 'rgba(255,255,255,0.2)'
      : 'rgba(255,255,255,0.08)';

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: `1px solid ${borderColor}`,
        background: bg,
        color: danger ? '#F87171' : 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        transform: hovered ? 'scale(1.08)' : 'scale(1)'
      }}
    >
      {children}
    </button>
  );
};

export default VideoCall;
