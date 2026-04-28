import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthFields.css';

const Register = () => {
  const [role, setRole] = useState('client');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Lawyer specific items
    barCouncilId: '',
    experience: '',
    location: '',
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = { ...formData, role };
      delete dataToSubmit.confirmPassword;
      await register(dataToSubmit);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2>Create an Account</h2>
        <p className="auth-subtitle">Join LegalAI to connect with legal experts</p>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <div className="role-selector">
          <button 
            className={`role-btn ${role === 'client' ? 'active' : ''}`}
            onClick={() => setRole('client')}
          >
            I am a Client
          </button>
          <button 
            className={`role-btn ${role === 'lawyer' ? 'active' : ''}`}
            onClick={() => setRole('lawyer')}
          >
            I am a Lawyer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                placeholder="At least 6 characters"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* Lawyer Info Section */}
          {role === 'lawyer' && (
            <div className="lawyer-fields">
              <h3 className="section-title">Professional Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="barCouncilId">Bar Council ID</label>
                  <input
                    type="text"
                    id="barCouncilId"
                    name="barCouncilId"
                    value={formData.barCouncilId}
                    onChange={handleChange}
                    required={role === 'lawyer'}
                    placeholder="e.g. BAR/123/2020"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="experience">Years of Experience</label>
                  <input
                    type="number"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required={role === 'lawyer'}
                    min="0"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="location">City/Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required={role === 'lawyer'}
                  placeholder="e.g. New York, NY"
                />
              </div>
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
