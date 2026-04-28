import { useState, useEffect } from 'react';
import api from '../services/api';

const ReviewsModal = ({ lawyerId, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/lawyer/${lawyerId}`);
        setReviews(res.data.data);
      } catch (err) {
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [lawyerId]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: '#111827', padding: '2.5rem', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '600px', margin: '1rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--secondary)', margin: 0, fontWeight: '800' }}>Client Feedback</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading feedback...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>{error}</div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No feedback available for this lawyer yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {reviews.map((review) => (
                <div key={review._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(217, 160, 91, 0.1)', color: '#D9A05B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '1px solid rgba(217, 160, 91, 0.2)' }}>
                        {review.client?.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--secondary)', fontSize: '1rem' }}>{review.client?.name || 'Anonymous Client'}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <span key={i} style={{ color: i < review.rating ? '#F59E0B' : 'rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    "{review.comment}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'right', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
