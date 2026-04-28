import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CaseCard from '../components/CaseCard';
import PostCaseModal from '../components/PostCaseModal';

const MyCases = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('open');

  const fetchDashboardData = async () => {
    try {
      const [casesRes, apptsRes] = await Promise.all([
        api.get('/cases/my/cases'),
        api.get('/appointments')
      ]);
      setCases(casesRes.data.data);
      setAppointments(apptsRes.data.data.filter(a => a.status !== 'cancelled').slice(0, 3));
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute stat counts
  const totalCases = cases.length;
  const openCount = cases.filter(c => c.status === 'open').length;
  const assignedCount = cases.filter(c => c.status === 'assigned').length;
  const resolvedCount = cases.filter(c => c.status === 'resolved' || c.status === 'closed').length;

  const openCasesList = cases.filter(c => ['open', 'pending_approval', 'posted'].includes(c.status));
  const inProgressCasesList = cases.filter(c => ['assigned', 'accepted', 'in-progress'].includes(c.status));
  const closedCasesList = cases.filter(c => ['resolved', 'closed', 'cancelled'].includes(c.status));

  const getActiveCases = () => {
    if (activeTab === 'open') return openCasesList;
    if (activeTab === 'in-progress') return inProgressCasesList;
    if (activeTab === 'closed') return closedCasesList;
    return [];
  };

  const activeCasesList = getActiveCases();

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Welcome, {user?.name.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage your legal cases and connect with lawyers
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', 
            color: '#0A0F1D', 
            padding: '0.75rem 1.25rem', 
            borderRadius: 'var(--radius-md)', 
            border: 'none', 
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.9'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Post New Case
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(217, 160, 91, 0.1)', color: '#D9A05B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.75rem', fontWeight: '800' }}>{totalCases}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Cases</p>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.75rem', fontWeight: '800' }}>{openCount}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Open Cases</p>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.75rem', fontWeight: '800' }}>{assignedCount}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Assigned</p>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>
          </div>
          <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.75rem', fontWeight: '800' }}>{resolvedCount}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Resolved & Closed</p>
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      {appointments.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', color: 'var(--text-main)', margin: 0, fontWeight: '700' }}>Upcoming Appointments</h2>
            <Link to="/appointments" style={{ fontSize: '0.85rem', color: '#D9A05B', textDecoration: 'none', fontWeight: '600' }}>View All →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {appointments.map(appt => (
              <div key={appt._id} style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#D9A05B', background: 'rgba(217, 160, 91, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {appt.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(appt.dateTime).toLocaleDateString()}</span>
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{appt.title}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>with {appt.lawyer?.name}</p>
                {appt.status === 'confirmed' && (
                  <Link to={`/video-call/${appt._id}`} style={{ marginTop: '0.5rem', textAlign: 'center', background: 'rgba(217, 160, 91, 0.1)', color: '#D9A05B', padding: '0.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}>
                    Join Meeting
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, fontWeight: '800' }}>Track Your Cases</h2>
        
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.35rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {['open', 'in-progress', 'closed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'rgba(217, 160, 91, 0.15)' : 'transparent',
                color: activeTab === tab ? '#D9A05B' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: activeTab === tab ? '800' : '600',
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {tab.replace('-', ' ')}
              <span style={{ 
                background: activeTab === tab ? '#D9A05B' : 'rgba(255,255,255,0.1)', 
                color: activeTab === tab ? '#0A0F1D' : 'var(--text-muted)',
                marginLeft: '8px', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800'
              }}>
                {tab === 'open' ? openCasesList.length : tab === 'in-progress' ? inProgressCasesList.length : closedCasesList.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeCasesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: '#475569', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: '700' }}>
            No {activeTab.replace('-', ' ')} Cases Found
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            {activeTab === 'open' ? 'Post your first case for lawyers to review.' : 'Check back later for progress on your cases.'}
          </p>
          {activeTab === 'open' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{ 
                background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', 
                color: '#0A0F1D', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', 
                border: 'none', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Post Your First Case
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {activeCasesList.map(caseItem => (
            <CaseCard key={caseItem._id} caseItem={caseItem} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <PostCaseModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchDashboardData();
          }} 
        />
      )}
    </div>
  );
};

export default MyCases;
