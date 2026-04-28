import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const BookAppointment = () => {
  const { lawyerId } = useParams();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('caseId');
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'online',
    location: ''
  });

  useEffect(() => {
    const fetchLawyer = async () => {
      try {
        const res = await api.get(`/lawyers/${lawyerId}`);
        setLawyer(res.data.data);
      } catch (err) {
        showToast('Failed to load lawyer details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchLawyer();
  }, [lawyerId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      await api.post('/appointments', {
        lawyerId,
        caseId,
        title: formData.title,
        description: formData.description,
        dateTime,
        type: formData.type,
        location: formData.location
      });

      if (formData.type === 'online') {
        showToast('Appointment requested! You can pay once the lawyer confirms.', 'success');
      } else {
        showToast('Appointment requested! You can pay at the meeting.', 'success');
      }
      navigate('/appointments');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to book appointment', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading lawyer profile...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Schedule Consultation</h1>
          <p style={{ color: 'var(--text-muted)' }}>Book a session with <strong>{lawyer.name}</strong></p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(217, 160, 91, 0.05)', borderRadius: '1rem', border: '1px solid rgba(217, 160, 91, 0.1)' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#D9A05B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Lawyer</h4>
            <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>{lawyer.name}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{lawyer.specializations?.join(', ')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#D9A05B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Consultation Fee</h4>
            <p style={{ fontWeight: '800', fontSize: '1.25rem', margin: 0 }}>₹{lawyer.consultationFee || 0}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Per 30-minute session</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Purpose of Meeting</label>
            <input 
              type="text" 
              name="title" 
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Initial discussion on property dispute"
              style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Brief Description</label>
            <textarea 
              name="description" 
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mention any specific points you'd like to discuss..."
              style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Preferred Date</label>
              <input 
                type="date" 
                name="date" 
                required
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Preferred Time</label>
              <input 
                type="time" 
                name="time" 
                required
                value={formData.time}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Meeting Type</label>
              <select 
                name="type" 
                value={formData.type}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem', background: 'white' }}
              >
                <option value="online">Online (Video Call)</option>
                <option value="offline">In-Person (Office)</option>
              </select>
            </div>
            {formData.type === 'offline' && (
              <div className="form-group">
                <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Proposed Location</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Lawyer's High Court Chambers"
                  style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }}
                />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={bookingLoading}
            style={{ width: '100%', padding: '1.1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: '700', cursor: bookingLoading ? 'not-allowed' : 'pointer', marginTop: '1rem', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(217, 160, 91, 0.4)' }}
          >
            {bookingLoading ? 'Requesting Appointment...' : 'Confirm Appointment Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
