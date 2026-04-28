import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '', // Mapped to 'Address' in UI
    bio: '',
    experience: '',
    specializations: [],
    consultationFee: 0
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        experience: user.experience || '',
        specializations: user.specializations || [],
        consultationFee: user.consultationFee || 0
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading profile...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage your account settings
        </p>
      </div>

      {message.text && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1.5rem', 
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          color: message.type === 'success' ? '#10B981' : '#EF4444',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Summary Box */}
      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: 'var(--radius-xl)', 
        padding: '2rem', 
        marginBottom: '2rem',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: '#D9A05B', 
          color: '#0A0F1D', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '2rem', 
          fontWeight: '800' 
        }}>
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '700' }}>
            {user.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            {user.email}
          </div>
          <span style={{ 
            background: user.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : user.role === 'lawyer' ? 'rgba(217, 160, 91, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
            color: user.role === 'admin' ? '#A78BFA' : user.role === 'lawyer' ? '#FCD34D' : '#60A5FA', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '1rem', 
            fontSize: '0.75rem', 
            fontWeight: '800', 
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Edit Form Box */}
      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: 'var(--radius-xl)', 
        padding: '2rem', 
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '1.5rem', fontWeight: '700' }}>Edit Profile</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Full Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Full Name
              </label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                style={{ 
                  background: 'rgba(10, 15, 29, 0.6)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  padding: '0.875rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                Phone
              </label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                style={{ 
                  background: 'rgba(10, 15, 29, 0.6)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  padding: '0.875rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Address
              </label>
              <input 
                type="text" 
                name="location" 
                value={formData.location} 
                onChange={handleChange} 
                style={{ 
                  background: 'rgba(10, 15, 29, 0.6)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  padding: '0.875rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Profile Picture Mock Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                Profile Picture
              </label>
              <div style={{ 
                background: 'rgba(10, 15, 29, 0.6)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                padding: '0.65rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button type="button" style={{ 
                  background: 'white', 
                  color: '#0A0F1D', 
                  border: 'none', 
                  padding: '0.25rem 0.5rem', 
                  fontSize: '0.8rem', 
                  fontWeight: '600', 
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}>
                  Choose File
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No file chosen</span>
              </div>
            </div>
            {/* Consultation Fee (Lawyer Only) */}
            {user.role === 'lawyer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  Consultation Fee (₹)
                </label>
                <input 
                  type="number" 
                  name="consultationFee" 
                  value={formData.consultationFee} 
                  onChange={handleChange} 
                  min="0"
                  style={{ 
                    background: 'rgba(10, 15, 29, 0.6)', 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    padding: '0.875rem 1rem', 
                    borderRadius: 'var(--radius-md)', 
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', 
                color: '#0A0F1D', 
                padding: '0.75rem 1.5rem', 
                borderRadius: 'var(--radius-md)', 
                border: 'none', 
                fontWeight: '700', 
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
