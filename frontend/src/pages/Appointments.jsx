import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Appointments = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (err) {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      showToast(`Appointment ${status} successfully`, 'success');
    } catch (err) {
      showToast('Failed to update appointment', 'error');
    }
  };

  const handlePayNow = async (appt) => {
    try {
      const res = await api.post('/payments/checkout', {
        appointmentId: appt._id,
        amount: appt.consultationFee || 500,
        description: `Consultation with ${appt.lawyer?.name}`
      });
      navigate(`/checkout/${res.data.data._id}`);
    } catch (err) {
      showToast('Failed to initiate payment', 'error');
    }
  };

  // Determine what badge/label to show for payment
  const getPaymentBadge = (appt) => {
    if (appt.type === 'offline') {
      return (
        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '800', background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', border: '1px solid currentColor' }}>
          Pay at Meeting
        </span>
      );
    }
    // Online appointments
    if (appt.paymentStatus === 'paid') {
      return (
        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid currentColor' }}>
          ✓ Paid
        </span>
      );
    }
    if (appt.status === 'confirmed' && appt.paymentStatus === 'unpaid') {
      return (
        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '800', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid currentColor' }}>
          Payment Required
        </span>
      );
    }
    if (appt.status === 'pending' && appt.paymentStatus === 'unpaid') {
      return (
        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '800', background: 'rgba(100, 116, 139, 0.1)', color: '#94A3B8', border: '1px solid currentColor' }}>
          Awaiting Confirmation
        </span>
      );
    }
    return null;
  };

  // Determine action buttons for the right side
  const getActionButtons = (appt) => {
    const buttons = [];

    // Lawyer: Confirm/Cancel pending appointments
    if (user.role === 'lawyer' && appt.status === 'pending') {
      buttons.push(
        <button key="confirm" onClick={() => handleStatusUpdate(appt._id, 'confirmed')} style={{ padding: '0.75rem 1.5rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
          Confirm
        </button>
      );
      buttons.push(
        <button key="cancel" onClick={() => handleStatusUpdate(appt._id, 'cancelled')} style={{ padding: '0.75rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
          Cancel
        </button>
      );
    }

    // Client: Pay Now — only for ONLINE + CONFIRMED + UNPAID
    if (user.role === 'client' && appt.type === 'online' && appt.status === 'confirmed' && appt.paymentStatus === 'unpaid') {
      buttons.push(
        <button
          key="pay"
          onClick={() => handlePayNow(appt)}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)',
            color: '#0A0F1D',
            border: 'none',
            borderRadius: '0.75rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(217, 160, 91, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          💳 Pay ₹{appt.consultationFee || 500}
        </button>
      );
    }

    // Join Video Call — only for ONLINE + CONFIRMED + PAID
    if (appt.type === 'online' && appt.status === 'confirmed' && appt.paymentStatus === 'paid') {
      buttons.push(
        <Link
          key="join"
          to={`/video-call/${appt._id}`}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.75rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}
        >
          📹 Join Video Call
        </Link>
      );
    }

    // Offline confirmed — show "Attend" label
    if (appt.type === 'offline' && appt.status === 'confirmed') {
      buttons.push(
        <span key="attend" style={{
          padding: '0.75rem 1.5rem',
          background: 'rgba(139, 92, 246, 0.1)',
          color: '#A78BFA',
          borderRadius: '0.75rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          📍 Attend in Person
        </span>
      );
    }

    return buttons;
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your schedule...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--secondary)' }}>Your Appointments</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your legal consultations and court dates.</p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {appointments.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No appointments scheduled yet.</p>
          </div>
        ) : (
          appointments.map(appt => (
            <div key={appt._id} style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Status badge */}
                  <span style={{
                    padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase',
                    background: appt.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : appt.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : appt.status === 'completed' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(217, 160, 91, 0.1)',
                    color: appt.status === 'confirmed' ? '#10B981' : appt.status === 'cancelled' ? '#EF4444' : appt.status === 'completed' ? '#3B82F6' : '#D9A05B',
                    border: '1px solid currentColor'
                  }}>
                    {appt.status}
                  </span>

                  {/* Payment badge */}
                  {getPaymentBadge(appt)}

                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(appt.dateTime).toLocaleString()}</span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: '800' }}>{appt.title}</h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{appt.description}</p>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
                   <span><strong>{user.role === 'lawyer' ? 'Client' : 'Lawyer'}:</strong> {user.role === 'lawyer' ? appt.client?.name : appt.lawyer?.name}</span>
                   {appt.type === 'online' ? (
                     <span style={{ color: 'var(--primary)', fontWeight: '600' }}>📹 Video Call</span>
                   ) : (
                     <span style={{ color: '#A78BFA', fontWeight: '600' }}>📍 In-Person{appt.location ? `: ${appt.location}` : ''}</span>
                   )}
                   {appt.type === 'online' && appt.consultationFee > 0 && (
                     <span style={{ color: '#D9A05B', fontWeight: '700' }}>₹{appt.consultationFee}</span>
                   )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {getActionButtons(appt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Appointments;
