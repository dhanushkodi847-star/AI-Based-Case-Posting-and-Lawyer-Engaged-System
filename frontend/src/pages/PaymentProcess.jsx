import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import PaymentModal from '../components/PaymentModal';

const PaymentProcess = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const res = await api.get('/payments/history');
        const found = res.data.data.find(t => t._id === transactionId);
        if (found) setTransaction(found);
        else throw new Error('Transaction not found');
      } catch (err) {
        showToast('Payment session expired or invalid', 'error');
        navigate('/appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  const handlePayment = async () => {
    if (!transaction) return;
    setModalOpen(true);
  };

  const handleModalSuccess = async () => {
    try {
      setModalOpen(false);
      setProcessing(true);
      await api.post(`/payments/verify/${transactionId}`);
      showToast('Payment Successful! Appointment confirmed.', 'success');
      navigate('/appointments');
    } catch (err) {
      showToast('Payment verification failed', 'error');
      setProcessing(false);
    }
  };

  const handleModalFailure = () => {
    setModalOpen(false);
    showToast('Payment cancelled or failed', 'error');
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>Initializing Secure Gateway...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto', padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--secondary)' }}>Secure Checkout</h2>
        <p style={{ color: 'var(--text-muted)' }}>Complete your consultation payment to {transaction?.lawyer?.name}</p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Description</span>
          <span style={{ fontWeight: '600', color: 'white' }}>{transaction?.description}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
          <span style={{ fontSize: '0.8rem', color: 'white' }}>{transaction?.transactionId}</span>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', margin: '1rem 0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '700', color: 'white' }}>Total Amount</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#D9A05B' }}>₹{transaction?.amount}</span>
        </div>
      </div>

      <button 
        onClick={handlePayment}
        disabled={processing}
        style={{ 
          width: '100%', 
          padding: '1.25rem', 
          background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', 
          color: '#0A0F1D', 
          border: 'none', 
          borderRadius: '1rem', 
          fontWeight: '900', 
          fontSize: '1.1rem', 
          cursor: processing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}
      >
        {processing ? 'Processing Transaction...' : `Pay ₹${transaction?.amount} Now`}
      </button>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        🔒 Your payment is safe and encrypted.
      </p>

      {transaction && (
        <PaymentModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          paymentId={transaction._id} 
          amount={transaction.amount} 
          onSuccess={handleModalSuccess} 
          onFailure={handleModalFailure}
          isAppointment={true}
        />
      )}
    </div>
  );
};

export default PaymentProcess;
