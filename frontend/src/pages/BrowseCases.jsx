import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CaseCard from '../components/CaseCard';

const BrowseCases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [allCases, setAllCases] = useState([]);
  const [matchingCases, setMatchingCases] = useState([]);
  const [assignedCases, setAssignedCases] = useState([]);
  const [interestedCases, setInterestedCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'matching', 'assigned'

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [allRes, matchRes, assignedRes, interestedRes, apptsRes] = await Promise.all([
          api.get('/cases?status=open'),
          api.get('/lawyers/matching-cases'),
          api.get('/lawyers/my-cases'),
          api.get('/lawyers/interested-cases'),
          api.get('/appointments')
        ]);
        
        setAllCases(allRes.data.data || []);
        setMatchingCases(matchRes.data.data || []);
        setAssignedCases(assignedRes.data.data || []);
        setInterestedCases(interestedRes.data.data || []);
        setAppointments(apptsRes.data.data.filter(a => a.status !== 'cancelled').slice(0, 3));
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleExpressInterest = async (caseItem) => {
    try {
      await api.post(`/lawyers/interest/${caseItem._id}`, { message: 'I am interested in handling this case.' });
      // Refresh data to update metrics and lists
      const [matchRes, interestedRes] = await Promise.all([
        api.get('/lawyers/matching-cases'),
        api.get('/lawyers/interested-cases')
      ]);
      setMatchingCases(matchRes.data.data || []);
      setInterestedCases(interestedRes.data.data || []);
      alert('Interest expressed successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to express interest.');
    }
  };

  const renderContent = () => {
    let currentCases = [];
    let title = '';
    
    if (activeTab === 'all') {
      currentCases = allCases;
      title = 'All Available Cases';
    } else if (activeTab === 'matching') {
      currentCases = matchingCases;
      title = 'Cases Matching Your Expertise';
    } else if (activeTab === 'assigned') {
      currentCases = assignedCases;
      title = 'Cases Assigned to You';
    }

    return (
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '1.5rem', fontWeight: '800' }}>{title}</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading cases...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#EF4444' }}>{error}</div>
        ) : currentCases.length === 0 ? (
          <div style={{ 
            background: 'var(--bg-card)', 
            borderRadius: '1rem', 
            padding: '4rem 2rem', 
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <div style={{ color: 'rgba(255,255,255,0.2)' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: '700' }}>No Cases Found</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>No cases match the current filter.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {currentCases.map(caseItem => (
              <CaseCard 
                key={caseItem._id} 
                caseItem={caseItem} 
                isLawyerView={true} 
                onInterestClick={handleExpressInterest}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: '#0A0F1D', marginLeft: '-2rem', marginRight: '-2rem', marginTop: '-2rem' }}>
      
      {/* Nested Lawyer Sidebar */}
      <div style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '2rem 0', background: '#0F172A' }}>
        
        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 1.5rem', marginBottom: '1rem' }}>MAIN</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem', marginBottom: '2rem' }}>
          {[
            { id: 'all', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, label: 'All Cases' },
            { id: 'matching', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>, label: 'Matching Cases' },
            { id: 'assigned', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>, label: 'My Cases' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: 'none',
                background: activeTab === item.id ? 'rgba(217, 160, 91, 0.1)' : 'transparent',
                color: activeTab === item.id ? '#D9A05B' : 'var(--text-muted)',
                fontWeight: activeTab === item.id ? '600' : '500',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem'
              }}
            >
              <span style={{ opacity: activeTab === item.id ? 1 : 0.7, display: 'flex' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 1.5rem', marginBottom: '1rem' }}>MORE</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem' }}>
          {[
            { path: '/messages', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>, label: 'Messages' },
            { path: '/appointments', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>, label: 'Appointments' },
            { path: '/profile', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>, label: 'Profile' }
          ].map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: '500',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                fontSize: '0.95rem'
              }}
            >
              <span style={{ opacity: 0.7, display: 'flex' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '2.5rem 3.5rem', overflowY: 'auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Lawyer Dashboard</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>
            Welcome, {user?.name || 'Counsel'} — Browse and accept cases matching your expertise
          </p>
        </div>

        {/* 3 Top Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          
          <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{allCases.length}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>Available Cases</p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(217, 160, 91, 0.1)', color: '#D9A05B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{interestedCases.length}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>Interested</p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{assignedCases.length}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>Assigned to Me</p>
            </div>
          </div>

        </div>

        {/* Upcoming Appointments Section */}
        {appointments.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, fontWeight: '800' }}>Upcoming Appointments</h3>
              <Link to="/appointments" style={{ fontSize: '0.9rem', color: '#D9A05B', textDecoration: 'none', fontWeight: '700' }}>View All Schedule →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {appointments.map(appt => (
                <div key={appt._id} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: appt.status === 'confirmed' ? '#10B981' : '#D9A05B', background: appt.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 160, 91, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '2rem' }}>
                      {appt.status}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(appt.dateTime).toLocaleString()}</span>
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '800' }}>{appt.title}</h4>
                  <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Client: {appt.client?.name}</p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {appt.status === 'confirmed' && appt.type === 'online' && (
                      <Link to={`/video-call/${appt._id}`} style={{ flex: 1, textAlign: 'center', background: '#D9A05B', color: '#0A0F1D', padding: '0.6rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: '800', textDecoration: 'none' }}>
                        Start Meeting
                      </Link>
                    )}
                    <Link to={`/appointments`} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.6rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', border: '1px solid var(--border)' }}>
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Content view depending on activeTab */}
        {renderContent()}

      </div>
    </div>
  );
};

export default BrowseCases;
