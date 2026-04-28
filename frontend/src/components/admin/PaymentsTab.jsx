import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const PaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/payments?page=${page}&limit=20&status=${statusFilter}`);
      setPayments(res.data.data);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const exportCSV = () => {
    if (payments.length === 0) return alert('No data to export');
    
    const headers = ['Transaction ID,Date,User Name,User Email,Case ID,Case Title,Amount (INR),Status'];
    const rows = payments.map(p => {
      const pId = p.razorpay_payment_id || p._id;
      const date = new Date(p.createdAt).toISOString();
      const uName = `"${p.userId?.name || 'N/A'}"`;
      const uEmail = `"${p.userId?.email || 'N/A'}"`;
      const cId = p.caseId?._id || 'N/A';
      const cTitle = `"${p.caseId?.title || 'Removed'}"`;
      const amt = p.amount;
      const status = p.status;
      return [pId, date, uName, uEmail, cId, cTitle, amt, status].join(',');
    });

    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payments_report_${new Date().getTime()}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'white', fontWeight: '800' }}>Ledger & Reports</h2>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.8rem 1.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: '#121A2F', color: 'white', outline: 'none', fontWeight: '600' }}>
            <option value="all">All Transactions</option>
            <option value="success">Successful Transfers</option>
            <option value="pending">Pending Validation</option>
            <option value="failed">Failed Drops</option>
          </select>
          <button onClick={exportCSV} style={{ padding: '0.8rem 1.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '1rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
             Download CSV
          </button>
        </div>
      </div>

      <div style={{ background: '#121A2F', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.25rem' }}>Transaction Origin</th>
              <th style={{ padding: '1.25rem' }}>Payment Gateway ID</th>
              <th style={{ padding: '1.25rem' }}>Linked Legal Case</th>
              <th style={{ padding: '1.25rem' }}>Settlement (INR)</th>
              <th style={{ padding: '1.25rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Loading secure ledger...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>No payment records found.</td></tr>
            ) : (
              payments.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1.25rem' }}>
                    <p style={{ color: 'white', fontWeight: '800', margin: 0 }}>{p.userId?.name || 'Unknown'}</p>
                    <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>{p.userId?.email || 'N/A'}</p>
                  </td>
                  <td style={{ padding: '1.25rem', color: '#94A3B8', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {p.razorpay_payment_id || p._id}
                    <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.25rem' }}>{new Date(p.createdAt).toLocaleString()}</div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ 
                      color: p.type === 'Consultation Fee' ? '#A78BFA' : '#3B82F6', 
                      fontSize: '0.65rem', 
                      textTransform: 'uppercase', 
                      display: 'inline-block', 
                      marginBottom: '0.4rem', 
                      fontWeight: '800',
                      border: p.type === 'Consultation Fee' ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.25rem'
                    }}>
                      {p.type || 'Case Fee'}
                    </span>
                    <p style={{ color: '#E2E8F0', fontWeight: '600', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '180px' }}>{p.caseId?.title || 'Appointment Consultation'}</p>
                    <span style={{ color: '#D9A05B', fontSize: '0.7rem', textTransform: 'uppercase' }}>{p.caseId?.category || 'General'}</span>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ color: '#10B981', fontWeight: '900', fontSize: '1.1rem' }}>₹{p.amount.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ 
                      color: p.status === 'success' ? '#10B981' : p.status === 'failed' ? '#EF4444' : '#F59E0B', 
                      fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', 
                      background: p.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : p.status === 'failed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                      padding: '0.3rem 0.6rem', borderRadius: '0.5rem' 
                    }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
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

export default PaymentsTab;
