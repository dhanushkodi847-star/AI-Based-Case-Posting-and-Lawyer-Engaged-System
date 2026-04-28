import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { IoReceiptOutline, IoTimeOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';

const PaymentHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/payments/history');
        setTransactions(res.data.data);
      } catch (err) {
        showToast('Failed to load transaction history', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>Analyzing Financial Records...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--secondary)' }}>Transaction History</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your payments and consultation fees.</p>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {transactions.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No transactions found.</p>
          </div>
        ) : (
          transactions.map(txn => (
            <div key={txn._id} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(217, 160, 91, 0.1)', color: '#D9A05B', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IoReceiptOutline size={24} />
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '700' }}>{txn.description}</h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>ID: {txn.transactionId}</span>
                  <span>•</span>
                  <span>{new Date(txn.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '800', fontSize: '1.25rem', color: 'white' }}>₹{txn.amount}</p>
                <span style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase',
                  color: txn.status === 'completed' ? '#10B981' : txn.status === 'pending' ? '#D9A05B' : '#EF4444'
                }}>
                  {txn.status === 'completed' ? <IoCheckmarkCircleOutline /> : txn.status === 'pending' ? <IoTimeOutline /> : <IoCloseCircleOutline />}
                  {txn.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
