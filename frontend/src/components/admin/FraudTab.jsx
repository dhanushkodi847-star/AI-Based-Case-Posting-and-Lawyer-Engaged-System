import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FraudTab = () => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchThreats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/fraud-detection');
      setThreats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  const toggleUser = async (userId) => {
    try {
      await api.put(`/admin/toggle-user/${userId}`);
      alert('User status toggled successfully.');
      fetchThreats();
    } catch (err) {
      alert('Failed to toggle user status');
    }
  };

  const dismissFlag = async (userId) => {
    try {
      await api.put(`/admin/toggle-flag/user/${userId}`);
      fetchThreats();
    } catch (err) {
      alert('Failed to dismiss internal flag');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.8rem' }}>🛡️</span> Threat Intelligence & Fraud
        </h2>
        <p style={{ color: '#94A3B8', marginTop: '0.5rem' }}>Automated AI scanning identifying mass-posting, duplicate accounts, and targeted spam.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', background: '#121A2F', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            Scanning backend topology for anomalies...
          </div>
        ) : threats.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: '#121A2F', borderRadius: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ fontSize: '3rem' }}>✅</span>
            <h3 style={{ color: '#10B981', margin: '1rem 0 0.5rem 0' }}>System Secure</h3>
            <p style={{ color: '#64748B', margin: 0 }}>No high-risk spam vectors detected across user accounts.</p>
          </div>
        ) : (
          threats.map(threat => (
            <div key={threat._id} style={{ background: '#121A2F', padding: '2rem', borderRadius: '1.5rem', border: threat.isSpam ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>{threat.name}</h3>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{threat.email} • {threat.role.toUpperCase()}</span>
                  {threat.isSpam && (
                    <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.3rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}>
                      ⚠️ POSSIBLE SPAM USER
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', marginTop: '1rem' }}>
                  {threat.reasons.map((r, i) => (
                    <span key={i} style={{ color: '#94A3B8', fontSize: '0.85rem' }}>• {r}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Computed Risk Score</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.5rem' }}>
                    <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${threat.riskScore}%`, height: '100%', background: threat.riskScore >= 70 ? '#EF4444' : '#F59E0B' }}></div>
                    </div>
                    <span style={{ color: threat.riskScore >= 70 ? '#EF4444' : '#F59E0B', fontWeight: '900', fontSize: '1.2rem' }}>{threat.riskScore}%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => dismissFlag(threat._id)} style={{ padding: '0.6rem 1.25rem', background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: 'none', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Dismiss Issue
                  </button>
                  <button onClick={() => toggleUser(threat._id)} style={{ padding: '0.6rem 1.25rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Suspend Account
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FraudTab;
