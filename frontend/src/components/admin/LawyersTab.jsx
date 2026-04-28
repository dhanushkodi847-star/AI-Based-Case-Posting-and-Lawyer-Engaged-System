import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const LawyersTab = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users?role=lawyer&limit=100');
      setLawyers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, []);

  const handleVerification = async (lawyerId, isVerified) => {
    try {
      await api.put(`/admin/verify-lawyer/${lawyerId}`, { isVerified });
      fetchLawyers();
    } catch (err) {
      alert('Lawyer verification failed');
    }
  };

  const toggleUser = async (userId) => {
    try {
      await api.put(`/admin/toggle-user/${userId}`);
      fetchLawyers();
    } catch (err) {
      alert('Failed to toggle user status');
    }
  };

  if (loading) return <div style={{ color: '#94A3B8' }}>Loading legal workforce...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem', animation: 'fadeIn 0.5s ease' }}>
      {lawyers.map(lawyer => (
        <div key={lawyer._id} style={{ background: '#121A2F', padding: '2.5rem', borderRadius: '2rem', border: lawyer.isVerified ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(217, 160, 91, 0.2)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'white', fontWeight: '900', fontSize: '1.3rem' }}>{lawyer.name}</h3>
            <span style={{ color: lawyer.isVerified ? '#10B981' : '#D9A05B', fontWeight: '900', fontSize: '0.7rem', border: `1px solid ${lawyer.isVerified ? '#10B981' : '#D9A05B'}`, padding: '0.2rem 0.6rem', borderRadius: '0.5rem' }}>
              {lawyer.isVerified ? 'VERIFIED' : 'PENDING'}
            </span>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: '1.6' }}>{lawyer.bio || 'Credentials under review. Detailed verification required for operational clearance.'}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                  <p style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Experience</p>
                  <p style={{ color: 'white', fontWeight: '800', margin: 0 }}>{lawyer.experience || 0} Years</p>
              </div>
              <div style={{ flex: 1 }}>
                  <p style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Rating</p>
                  <p style={{ color: 'white', fontWeight: '800', margin: 0 }}>★ {lawyer.averageRating || 'N/A'}</p>
              </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
            {!lawyer.isVerified ? (
              <button onClick={() => handleVerification(lawyer._id, true)} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(90deg, #D9A05B 0%, #B47B3E 100%)', color: '#0A0F1D', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 15px rgba(217, 160, 91, 0.2)' }}>
                Approve Auth
              </button>
            ) : (
              <button disabled style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'not-allowed' }}>
                Approved
              </button>
            )}
            
            <button onClick={() => toggleUser(lawyer._id)} style={{ width: '100%', padding: '1rem', background: lawyer.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: lawyer.isActive ? '#EF4444' : '#10B981', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s' }}>
              {lawyer.isActive ? 'Suspend' : 'Reactivate'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LawyersTab;
