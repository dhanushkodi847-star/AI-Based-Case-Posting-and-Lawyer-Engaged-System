import { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const ReviewForm = ({ caseId, lawyerId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return showToast('Please select a rating', 'error');
    
    setLoading(true);
    try {
      await api.post('/reviews', { caseId, rating, comment });
      showToast('Thank you for your review!', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2.5rem', padding: '2.5rem', background: '#0F172A', borderRadius: 'var(--radius-xl)', border: '1px solid #10B98130', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
      <h3 style={{ fontSize: '1.5rem', color: '#10B981', marginBottom: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span>⭐</span> Finalize & Rate Counsel
      </h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Your feedback helps other clients find reliable legal representation and builds the platform's trust score.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                background: 'none', border: 'none', fontSize: '2.5rem',
                cursor: 'pointer', transition: 'transform 0.2s',
                transform: (star <= (hover || rating)) ? 'scale(1.2)' : 'scale(1)',
                color: (star <= (hover || rating)) ? '#F59E0B' : 'rgba(255,255,255,0.05)'
              }}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe your experience with the counsel. Was the communication clear? Was the case handled professionally?"
          required
          rows="4"
          style={{ width: '100%', padding: '1.25rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', color: 'white', fontFamily: 'inherit', marginBottom: '1.5rem', resize: 'vertical' }}
        />

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)', color: 'white', padding: '1rem', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
        >
          {loading ? 'Submitting Feedback...' : 'Post Official Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
