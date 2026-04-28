import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users?limit=100');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUser = async (userId) => {
    try {
      await api.put(`/admin/toggle-user/${userId}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to toggle user status');
    }
  };

  if (loading) return <div style={{ color: '#94A3B8' }}>Loading Global Directory...</div>;

  return (
    <div style={{ background: '#121A2F', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.5s ease' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <tr>
            <th style={{ padding: '1.5rem 2rem' }}>Platform Identity</th>
            <th style={{ padding: '1.5rem 2rem' }}>Designation</th>
            <th style={{ padding: '1.5rem 2rem' }}>System Status</th>
            <th style={{ padding: '1.5rem 2rem' }}>Registration Date</th>
            <th style={{ padding: '1.5rem 2rem' }}>Oversight Engine</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <td style={{ padding: '1.5rem 2rem' }}>
                <p style={{ color: 'white', fontWeight: '800', margin: 0 }}>{u.name}</p>
                <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>{u.email}</p>
              </td>
              <td style={{ padding: '1.5rem 2rem' }}>
                <span style={{ color: u.role === 'lawyer' ? '#D9A05B' : u.role === 'admin' ? '#8B5CF6' : '#3B82F6', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '0.5rem' }}>
                  {u.role}
                </span>
              </td>
              <td style={{ padding: '1.5rem 2rem' }}>
                <span style={{ color: u.isActive ? '#10B981' : '#EF4444', fontWeight: '800', fontSize: '0.75rem', background: u.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '0.5rem' }}>{u.isActive ? 'OPERATIONAL' : 'SUSPENDED'}</span>
              </td>
              <td style={{ padding: '1.5rem 2rem', color: '#64748B', fontSize: '0.85rem' }}>
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: '1.5rem 2rem' }}>
                {u.role !== 'admin' && (
                  <button onClick={() => toggleUser(u._id)} style={{ background: u.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: u.isActive ? '#EF4444' : '#10B981', border: '1px solid ' + (u.isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'), padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {u.isActive ? 'Deactivate User' : 'Restore Access'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTab;
