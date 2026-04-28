import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for logged in user on load
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.get('/auth/profile');
          setUser({ ...res.data.data, token });
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      
      const { token, ...userData } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(res.data.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const res = await api.post('/auth/register', userData);
      
      const { token, ...data } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data));
      
      setUser(res.data.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const res = await api.put('/auth/profile', userData);
      const token = localStorage.getItem('token');
      
      setUser({ ...res.data.data, token });
      localStorage.setItem('user', JSON.stringify(res.data.data));
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isLawyer: user?.role === 'lawyer',
    isClient: user?.role === 'client',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
