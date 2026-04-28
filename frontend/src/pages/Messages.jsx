import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const Messages = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams] = useSearchParams();
  const lawyerIdParam = searchParams.get('lawyerId');
  
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Advanced Messaging States
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [infoMsgId, setInfoMsgId] = useState(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch conversations (Inbox)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/messages');
        const fetchedConversations = res.data.data;
        setConversations(fetchedConversations);

        // Handle lawyerId from query param
        if (lawyerIdParam) {
          const existingConv = fetchedConversations.find(c => c.user._id === lawyerIdParam);
          if (existingConv) {
            setActiveChatId(existingConv.user._id);
            setActiveChatUser(existingConv.user);
          } else {
            // New conversation - fetch lawyer info
            try {
              const res = await api.get(`/auth/users/${lawyerIdParam}`);
              const lawyerUser = res.data.data;
              setActiveChatId(lawyerUser._id);
              setActiveChatUser(lawyerUser);
              
              // Add a fake entry to conversations list so it shows up in sidebar
              setConversations(prev => [{
                user: lawyerUser,
                lastMessage: 'Start a conversation...',
                lastMessageAt: new Date().toISOString(),
                unreadCount: 0
              }, ...prev]);
            } catch (err) {
              console.error('Failed to fetch lawyer info');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [lawyerIdParam]);

  // Fetch active chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChatId) return;
      try {
        const res = await api.get(`/messages/${activeChatId}`);
        setMessages(res.data.data);
        
        // Mark as read in local conversation list
        setConversations(prev => 
          prev.map(c => c.user._id === activeChatId ? { ...c, unreadCount: 0 } : c)
        );
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };
    fetchMessages();
  }, [activeChatId]);

  // Handle incoming Socket.IO messages
  useEffect(() => {
    if (!socket) return;
    
    // Listen for new messages
    socket.on('receiveMessage', (message) => {
      // If the message is for the currently open chat, add it
      if (
        (activeChatId === message.sender._id && user._id === message.receiver._id) || 
        (activeChatId === message.receiver._id && user._id === message.sender._id)
      ) {
        setMessages(prev => [...prev, message]);
        
        // Update unread count if we received it but we're the sender? No need.
        // It's already open.
      } else {
        // If not open chat, increment unread count in inbox list
        if (message.receiver._id === user._id) {
          setConversations(prev => {
            const exists = prev.find(c => c.user._id === message.sender._id);
            if (exists) {
              return prev.map(c => 
                c.user._id === message.sender._id 
                  ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt, unreadCount: c.unreadCount + 1 } 
                  : c
              ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
            } else {
              // Add new conversation if it doesn't exist locally
              return [{
                user: message.sender,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                unreadCount: 1
              }, ...prev];
            }
          });
        }
      }
    });

    socket.on('messageEdited', (updatedMsg) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
      // update conversation summary optionally
      setConversations(prev => prev.map(c => {
        if ((c.user._id === updatedMsg.sender._id || c.user._id === updatedMsg.receiver._id) && c.lastMessageAt === updatedMsg.createdAt) {
          return { ...c, lastMessage: updatedMsg.content };
        }
        return c;
      }));
    });

    socket.on('messageDeleted', ({ messageId, receiverId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    socket.on('messagesRead', ({ from, readAt, messageIds }) => {
      setMessages(prev => prev.map(m => messageIds.includes(m._id) ? { ...m, read: true, readAt } : m));
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('messageEdited');
      socket.off('messageDeleted');
      socket.off('messagesRead');
    };
  }, [socket, activeChatId, user._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup explicit MediaRecorder hooks upon dismount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeChatId) return;

    const messageContent = newMessage;
    const fileToSend = selectedFile;
    setNewMessage('');
    setSelectedFile(null); // clear input early for responsiveness

    try {
      if (!fileToSend) {
        // Optimistic upate ONLY for text
        const tempMsg = {
          _id: Date.now().toString(),
          sender: user,
          receiver: activeChatUser,
          content: messageContent,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);

        setConversations(prev => {
          const newConvs = prev.map(c => c.user._id === activeChatId ? { ...c, lastMessage: messageContent, lastMessageAt: new Date().toISOString() } : c);
          return newConvs.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });
      }

      if (fileToSend) {
        const formData = new FormData();
        formData.append('receiverId', activeChatId);
        if (messageContent.trim()) formData.append('content', messageContent);
        formData.append('file', fileToSend);

        const res = await api.post('/messages', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setMessages(prev => [...prev, res.data.data]);
        setConversations(prev => {
          const fallbackText = messageContent.trim() || '📎 Attachment';
          const newConvs = prev.map(c => c.user._id === activeChatId ? { ...c, lastMessage: fallbackText, lastMessageAt: new Date().toISOString() } : c);
          return newConvs.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });
      } else {
        await api.post('/messages', {
          receiverId: activeChatId,
          content: messageContent
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleEditSubmit = async (msgId) => {
    try {
      if (!editContent.trim()) return;
      const res = await api.put(`/messages/${msgId}`, { content: editContent });
      setMessages(prev => prev.map(m => m._id === msgId ? res.data.data : m));
      setEditingMessageId(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to edit message', err);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await api.delete(`/messages/${msgId}`);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingDuration(0);
        clearInterval(recordingTimerRef.current);

        if (activeChatId) {
          try {
            const formData = new FormData();
            formData.append('receiverId', activeChatId);
            formData.append('file', audioBlob, `voice_message_${Date.now()}.webm`);

            const res = await api.post('/messages', formData);
            setMessages(prev => [...prev, res.data.data]);
            setConversations(prev => {
              const newConvs = prev.map(c => c.user._id === activeChatId ? { ...c, lastMessage: '🎤 Voice message', lastMessageAt: new Date().toISOString() } : c);
              return newConvs.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
            });
          } catch (err) {
            console.error('Failed to send audio message', err);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone access denied', err);
      alert('Microphone access denied. Please allow microphone permissions in your browser to send voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = []; // Wipe chunks
      mediaRecorderRef.current.stop();
    }
  };

  const openChat = (convUser) => {
    setActiveChatId(convUser._id);
    setActiveChatUser(convUser);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading messages...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Messages
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Secure private messaging with lawyers and clients
        </p>
      </div>

      <div style={{ height: 'calc(100vh - 220px)', display: 'grid', gridTemplateColumns: '300px 1fr', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        {/* Sidebar - Inbox */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: 'rgba(10, 15, 29, 0.4)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Conversations</h2>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {conversations.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#475569', padding: '2rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '1rem', opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span style={{ fontSize: '0.85rem' }}>No conversations yet</span>
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.user._id} 
                  onClick={() => openChat(conv.user)}
                  style={{ 
                    padding: '1rem 1.5rem', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: activeChatId === conv.user._id ? 'rgba(217, 160, 91, 0.05)' : 'transparent',
                    borderLeft: activeChatId === conv.user._id ? '3px solid #D9A05B' : '3px solid transparent',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', background: activeChatId === conv.user._id ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: activeChatId === conv.user._id ? '#0A0F1D' : 'var(--text-main)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
                    {conv.user.name.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.user.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: conv.unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: conv.unreadCount > 0 ? '600' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '1rem', padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
  
        {/* Main Chat Area */}
        {activeChatId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-card)' }}>
            {/* Chat Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10, 15, 29, 0.6)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(217, 160, 91, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.125rem' }}>
                {activeChatUser.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '700' }}>{activeChatUser.name}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{activeChatUser.role}</p>
              </div>
            </div>
  
            {/* Messages List */}
            <div style={{ flex: 1, minHeight: 0, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div ref={messagesEndRef} />
              {messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#475569', marginTop: '2rem', fontSize: '0.9rem' }}>No messages yet. Say hello!</p>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender._id === user._id;
                  const isEditing = editingMessageId === msg._id;
                  const isHovered = hoveredMsgId === msg._id;
                  const showInfo = infoMsgId === msg._id;

                  return (
                    <div 
                      key={msg._id} 
                      style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%', position: 'relative' }}
                      onMouseEnter={() => setHoveredMsgId(msg._id)}
                      onMouseLeave={() => setHoveredMsgId(null)}
                    >
                      <div style={{ 
                          background: isMine ? 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)' : 'rgba(255,255,255,0.05)', 
                          color: isMine ? '#0A0F1D' : 'var(--text-main)', 
                          padding: '0.875rem 1.25rem', 
                          borderRadius: '1.25rem', 
                          borderBottomRightRadius: isMine ? '4px' : '1.25rem', 
                          borderBottomLeftRadius: isMine ? '1.25rem' : '4px', 
                          border: isMine ? 'none' : '1px solid rgba(255,255,255,0.05)',
                          fontWeight: isMine ? '500' : 'normal',
                          display: 'flex', flexDirection: 'column'
                        }}>
                        
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input 
                              type="text" 
                              value={editContent} 
                              onChange={e => setEditContent(e.target.value)} 
                              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.1)', color: 'inherit', outline: 'none' }} 
                              autoFocus 
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => setEditingMessageId(null)} style={{ background: 'transparent', border: 'none', color: isMine ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Cancel</button>
                              <button onClick={() => handleEditSubmit(msg._id)} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'inherit', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {msg.fileUrl && msg.fileType === 'image' && (
                              <a href={`http://localhost:5000${msg.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                <img src={`http://localhost:5000${msg.fileUrl}`} alt={msg.originalName} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover' }} />
                              </a>
                            )}
                            {msg.fileUrl && msg.fileType === 'document' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                <span style={{ fontSize: '1.25rem' }}>📄</span>
                                <a href={`http://localhost:5000${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', wordBreak: 'break-all' }}>
                                  {msg.originalName}
                                </a>
                              </div>
                            )}
                            {msg.fileUrl && msg.fileType === 'audio' && (
                              <div style={{ padding: '4px 0', opacity: 0.9 }}>
                                <audio controls src={`http://localhost:5000${msg.fileUrl}`} style={{ height: '36px', maxWidth: '240px', outline: 'none', display: 'block' }} />
                              </div>
                            )}
                            {msg.content && <p style={{ margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{msg.content}</p>}
                          </div>
                        )}

                        {/* Status Line inside bubble */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center', marginTop: '4px' }}>
                          {msg.isEdited && <span style={{ fontSize: '0.65rem', opacity: 0.7, fontStyle: 'italic' }}>(edited)</span>}
                          {isMine && msg.read && <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Seen</span>}
                        </div>
                      </div>

                      {/* --- Hover Options Menu (Instagram style) --- */}
                      {isHovered && !isEditing && (
                        <div style={{ position: 'absolute', top: '50%', [isMine ? 'left' : 'right']: '-35px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--bg-card)', padding: '0.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 10 }}>
                          <button onClick={() => setInfoMsgId(showInfo ? null : msg._id)} title="Info" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px', display: 'flex' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></button>
                          
                          {isMine && !msg.fileUrl && (
                            <button onClick={() => { setEditingMessageId(msg._id); setEditContent(msg.content); setHoveredMsgId(null); setInfoMsgId(null); }} title="Edit" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px', display: 'flex' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
                          )}
                          
                          {isMine && (
                            <button onClick={() => handleDeleteMessage(msg._id)} title="Unsend" style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px', display: 'flex' }} onMouseOver={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                          )}
                        </div>
                      )}

                      {/* --- Info Modal (Instagram style) --- */}
                      {showInfo && (
                        <div style={{ position: 'absolute', top: '100%', [isMine ? 'right' : 'left']: '0', marginTop: '0.5rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 20, minWidth: '150px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <p style={{ margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between' }}><span>Sent:</span> <strong style={{color:'var(--text-main)'}}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>
                          {msg.isEdited && <p style={{ margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between' }}><span>Edited:</span> <strong style={{color:'var(--text-main)'}}>{new Date(msg.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>}
                          {isMine && msg.read && <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}><span>Seen:</span> <strong style={{color:'#10B981'}}>{new Date(msg.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></p>}
                        </div>
                      )}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block', textAlign: isMine ? 'right' : 'left' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
  
            {/* Message Input */}
            <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10, 15, 29, 0.6)' }}>
              {selectedFile && !isRecording && (
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(217, 160, 91, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9A05B' }}>
                    {selectedFile.type.startsWith('image/') ? '🖼️' : '📄'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedFile.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem', fontWeight: 'bold' }}>✕</button>
                </div>
              )}
              
              {isRecording ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem 1.25rem', borderRadius: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)', height: '48px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)', opacity: recordingDuration % 2 === 0 ? 1 : 0.4, transition: 'opacity 0.5s' }} />
                  <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.1rem', flex: 1 }}>
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </span>
                  <button onClick={cancelRecording} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', opacity: 0.8, cursor: 'pointer', padding: '0.5rem', fontWeight: 'bold' }}>Cancel</button>
                  <button onClick={stopRecording} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0 1.25rem', height: '36px', borderRadius: '1.5rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2z"></path></svg> Send</button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    title="Attach File"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{ flex: 1, padding: '0.875rem 1.25rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                  />
                  
                  {newMessage.trim() || selectedFile ? (
                    <button type="submit" style={{ background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', color: '#0A0F1D', padding: '0 1.75rem', height: '48px', borderRadius: '2rem', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                      Send
                    </button>
                  ) : (
                    <button type="button" onClick={startRecording} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }} title="Record Voice Message" onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', background: 'var(--bg-card)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1.5rem', opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <p style={{ fontSize: '0.95rem' }}>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
