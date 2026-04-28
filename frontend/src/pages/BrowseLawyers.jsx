import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ReviewsModal from '../components/ReviewsModal';

const BrowseLawyers = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [selectedLawyerId, setSelectedLawyerId] = useState(null);

  const availableSpecializations = [
    'Criminal Law', 'Civil Law', 'Family Law', 'Corporate Law',
    'Property Law', 'Labor Law', 'Constitutional Law', 'Tax Law',
    'Consumer Law', 'Cyber Law', 'Immigration Law', 'Environmental Law'
  ];

  useEffect(() => {
    const fetchLawyers = async () => {
      setLoading(true);
      try {
        let url = '/lawyers?';
        if (search) url += `search=${search}&`;
        if (specialization) url += `specialization=${specialization}`;
        
        const res = await api.get(url);
        setLawyers(res.data.data);
      } catch (err) {
        setError('Failed to load lawyers');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchLawyers();
    }, 500); // debounce search

    return () => clearTimeout(timer);
  }, [search, specialization]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Find Expert Lawyers</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>Connect with verified legal professionals specialized in your needed domain.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '1rem', marginBottom: '3rem', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Search by Name or Location</label>
          <input 
            type="text" 
            placeholder="Search lawyers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Filter by Specialization</label>
          <select 
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'white' }}
          >
            <option value="">All Specializations</option>
            {availableSpecializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading lawyers...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>{error}</div>
      ) : lawyers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>No lawyers found.</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {lawyers.map(lawyer => (
            <div key={lawyer._id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {lawyer.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--secondary)', margin: 0 }}>{lawyer.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: '700' }}>✓ Verified</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ color: '#F59E0B', fontSize: '1rem' }}>★</span>
                      <span style={{ color: 'white', fontWeight: '800', fontSize: '0.9rem' }}>{lawyer.averageRating || '0.0'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({lawyer.totalReviews || 0})</span>
                      {(lawyer.totalReviews || 0) > 0 && (
                        <button
                          onClick={() => setSelectedLawyerId(lawyer._id)}
                          style={{ background: 'none', border: 'none', color: '#D9A05B', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginLeft: '0.5rem', fontWeight: '600' }}
                        >
                          View Feedback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  💼 {lawyer.experience || 0} Years Experience
                </span>
                <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>|</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📍 {lawyer.location || 'Remote'}
                </span>
              </div>

              <div style={{ marginBottom: '1rem', flex: 1 }}>
                <p style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.95rem', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
                  {lawyer.bio || 'Professional legal expert dedicated to providing the best legal assistance and representation.'}
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {lawyer.specializations.map((spec, i) => (
                    <span key={i} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Link to={`/messages?lawyerId=${lawyer._id}`} className="nav-btn primary-btn" style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', color: '#0A0F1D', border: 'none', borderRadius: 'var(--radius-lg)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '800', textAlign: 'center', display: 'inline-block', width: '100%' }}>
                  Connect with Counsel
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLawyerId && (
        <ReviewsModal 
          lawyerId={selectedLawyerId} 
          onClose={() => setSelectedLawyerId(null)} 
        />
      )}
    </div>
  );
};

export default BrowseLawyers;
