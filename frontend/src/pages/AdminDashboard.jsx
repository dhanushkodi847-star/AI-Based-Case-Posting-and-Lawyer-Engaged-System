import { useState, useEffect } from 'react';
import api from '../services/api';

import AnalyticsTab from '../components/admin/AnalyticsTab';
import CasesTab from '../components/admin/CasesTab';
import LawyersTab from '../components/admin/LawyersTab';
import PaymentsTab from '../components/admin/PaymentsTab';
import FraudTab from '../components/admin/FraudTab';
import SystemTab from '../components/admin/SystemTab';
import UsersTab from '../components/admin/UsersTab';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGlobalStats = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data.data);
    } catch (err) {
      console.error('Failed to load global metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '5rem', textAlign: 'center', color: 'white', background: '#0A0F1D', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#D9A05B', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h2 style={{ fontWeight: '800' }}>Booting Enterprise Control Panel...</h2>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', icon: '📊', label: 'Overview & Analytics' },
    { id: 'cases', icon: '📂', label: 'Case Management' },
    { id: 'lawyers', icon: '⚖️', label: 'Workforce Control' },
    { id: 'payments', icon: '💳', label: 'Financial Ledger' },
    { id: 'users', icon: '👥', label: 'Global Directory' },
    { id: 'fraud', icon: '🛡️', label: 'Threat Intelligence' },
    { id: 'system', icon: '⚙️', label: 'Platform Operations' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: '#0A0F1D' }}>
      {/* Sidebar */}
      <div style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', paddingTop: '2.5rem', background: '#0D1426', flexShrink: 0 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 2rem', marginBottom: '2rem' }}>Control Center</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', border: 'none',
                background: activeTab === item.id ? 'rgba(217, 160, 91, 0.08)' : 'transparent',
                color: activeTab === item.id ? '#D9A05B' : '#94A3B8',
                fontWeight: activeTab === item.id ? '800' : '600', borderRadius: '12px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.2s', borderLeft: activeTab === item.id ? '4px solid #D9A05B' : '4px solid transparent'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span> {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Viewport */}
      <div style={{ flex: 1, padding: '3.5rem 4rem', overflowY: 'auto' }}>
        <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '1rem' }}>
               {navItems.find(i => i.id === activeTab)?.icon} {navItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p style={{ color: '#64748B', marginTop: '0.5rem', fontSize: '1.1rem' }}>Enterprise administrative operations module.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center' }}>
               <span style={{ color: '#10B981', fontWeight: '800', fontSize: '0.85rem' }}>● System Secure</span>
            </div>
            {activeTab === 'overview' && (
              <button onClick={fetchGlobalStats} style={{ padding: '0.75rem 1.5rem', background: 'rgba(217, 160, 91, 0.1)', color: '#D9A05B', border: '1px solid #D9A05B', borderRadius: '1rem', fontWeight: '800', cursor: 'pointer' }}>
                Refresh Data
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Tab Rendering Layer */}
        {activeTab === 'overview' && <AnalyticsTab analytics={analytics} />}
        {activeTab === 'cases' && <CasesTab />}
        {activeTab === 'lawyers' && <LawyersTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'fraud' && <FraudTab />}
        {activeTab === 'system' && <SystemTab />}

      </div>
    </div>
  );
};

export default AdminDashboard;
