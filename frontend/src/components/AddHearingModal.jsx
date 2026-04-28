import React, { useState } from 'react';
import { FaCalendarAlt, FaTimes, FaGavel, FaAlignLeft } from 'react-icons/fa';

const AddHearingModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date || !time) return;
    
    // Combine date and time into a single valid Date string
    const combinedDateTime = `${date}T${time}:00`;
    
    onSubmit({
      title,
      date: combinedDateTime,
      description
    });
  };

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    },
    modal: {
      backgroundColor: '#1E293B', borderRadius: '16px', width: '100%', maxWidth: '450px',
      overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', fontFamily: 'system-ui, -apple-system, sans-serif',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    header: {
      backgroundColor: '#0F172A', padding: '20px 24px', display: 'flex', 
      justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
    title: { margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#D9A05B', display: 'flex', alignItems: 'center', gap: '10px' },
    closeBtn: {
      background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s'
    },
    form: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.875rem', fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' },
    input: {
      padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
      backgroundColor: 'rgba(0,0,0,0.2)', color: '#f8fafc', fontSize: '1rem', outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s', width: '100%', boxSizing: 'border-box'
    },
    row: { display: 'flex', gap: '16px' },
    primaryBtn: {
      width: '100%', padding: '14px', background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', 
      color: '#0A0F1D', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer',
      marginTop: '10px', transition: 'opacity 0.2s, transform 0.1s'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} className="animate-fade-in-up">
        <div style={styles.header}>
          <h3 style={styles.title}><FaGavel /> Schedule Hearing</h3>
          <button 
            style={styles.closeBtn} 
            onClick={onClose} 
            disabled={loading}
            onMouseOver={(e) => e.target.style.color = '#ef4444'}
            onMouseOut={(e) => e.target.style.color = '#94a3b8'}
          >
            <FaTimes />
          </button>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Hearing Title</label>
            <input 
              required
              style={styles.input} 
              type="text" 
              placeholder="e.g. Preliminary Arguments" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = '#D9A05B'; e.target.style.boxShadow = '0 0 0 2px rgba(217, 160, 91, 0.2)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={styles.row}>
            <div style={{...styles.inputGroup, flex: 1}}>
              <label style={styles.label}><FaCalendarAlt size={12} /> Date</label>
              <input 
                required
                style={{...styles.input, colorScheme: 'dark'}} 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onFocus={(e) => { e.target.style.borderColor = '#D9A05B'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>
            
            <div style={{...styles.inputGroup, flex: 1}}>
              <label style={styles.label}>Time</label>
              <input 
                required
                style={{...styles.input, colorScheme: 'dark'}} 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onFocus={(e) => { e.target.style.borderColor = '#D9A05B'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaAlignLeft size={12} /> Short Description</label>
            <textarea 
              style={{...styles.input, minHeight: '80px', resize: 'vertical'}} 
              placeholder="Case briefing, documents to prepare, etc." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = '#D9A05B'; e.target.style.boxShadow = '0 0 0 2px rgba(217, 160, 91, 0.2)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button 
            type="submit" 
            style={{...styles.primaryBtn, opacity: loading ? 0.7 : 1}}
            disabled={loading}
            onMouseDown={(e) => { if(!loading) e.target.style.transform = 'scale(0.98)'; }}
            onMouseUp={(e) => { if(!loading) e.target.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { if(!loading) e.target.style.transform = 'scale(1)'; }}
          >
            {loading ? 'Scheduling...' : 'Confirm Court Date'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddHearingModal;
