import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const CasesTab = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/cases?page=${page}&limit=10&search=${search}&status=${statusFilter}&type=${typeFilter}`);
      setCases(res.data.data);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, statusFilter, typeFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to securely delete this case? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/cases/${id}`);
      fetchCases();
    } catch (err) {
      alert('Failed to delete case.');
    }
  };

  // Simulated AI Logic for fake vs real
  const calculateRisk = (caseItem) => {
    // If you actually had Python AI hooked up, it would come from the backend. 
    // We simulate it here dynamically based on description length and flags.
    let score = 5;
    if (caseItem.isFlagged) score += 40;
    if (caseItem.description?.length < 20) score += 30; // very short description is suspicious
    return Math.min(score, 100);
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search by Title, ID, or Keywords..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchCases()}
          style={{ flex: 1, minWidth: '250px', padding: '0.8rem 1.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: '#121A2F', color: 'white', outline: 'none' }}>
          <option value="all">All Statuses</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="open">Open / Searching</option>
          <option value="assigned">Assigned / Engaged</option>
          <option value="resolved">Closed / Resolved</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: '#121A2F', color: 'white', outline: 'none' }}>
          <option value="all">All Categories</option>
          <option value="Civil">Civil</option>
          <option value="Criminal">Criminal</option>
          <option value="Family">Family</option>
          <option value="Corporate">Corporate</option>
        </select>
        <button onClick={fetchCases} style={{ padding: '0.8rem 1.5rem', background: '#D9A05B', color: '#0A0F1D', border: 'none', borderRadius: '1rem', fontWeight: '800', cursor: 'pointer' }}>Search</button>
      </div>

      <div style={{ background: '#121A2F', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.25rem' }}>Case Origin</th>
              <th style={{ padding: '1.25rem' }}>Status</th>
              <th style={{ padding: '1.25rem' }}>AI Validation</th>
              <th style={{ padding: '1.25rem' }}>Counsel</th>
              <th style={{ padding: '1.25rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Scanning Registry...</td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No cases matched your criteria.</td></tr>
            ) : (
              cases.map(c => {
                const risk = calculateRisk(c);
                return (
                  <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '1.25rem' }}>
                      <p style={{ color: 'white', fontWeight: '800', margin: 0 }}>{c.title.slice(0, 30)}{c.title.length > 30 ? '...' : ''}</p>
                      <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>Client: {c.postedBy?.name || 'Unknown'}</p>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ 
                        color: c.status === 'resolved' ? '#10B981' : c.status === 'pending_approval' ? '#F59E0B' : '#60A5FA', 
                        fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', 
                        background: c.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : c.status === 'pending_approval' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(96, 165, 250, 0.1)', 
                        padding: '0.3rem 0.6rem', borderRadius: '0.5rem' 
                      }}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>Sys-Category: <strong>{c.category}</strong></span>
                        <span style={{ color: risk > 50 ? '#EF4444' : '#10B981', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          Risk Score: {risk}% {risk > 50 && '⚠️'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {c.assignedLawyer ? (
                        <p style={{ color: '#D9A05B', margin: 0, fontWeight: '700' }}>{c.assignedLawyer.name}</p>
                      ) : (
                        <span style={{ color: '#64748B', fontSize: '0.8rem', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <button onClick={() => handleDelete(c._id)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                        Delete Case
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <span style={{ color: '#94A3B8', padding: '0.5rem' }}>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      )}
    </div>
  );
};

export default CasesTab;
