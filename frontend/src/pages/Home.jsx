import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect them to their specific dashboard
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'lawyer') return <Navigate to="/lawyer/dashboard" replace />;
    if (user.role === 'client') return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="hero">
        <div className="hero-badge">
          ✨ AI-Powered Legal Tech Platform
        </div>
        
        <h1>Smart Legal Assistance<br/>With AI & NLP</h1>
        
        <p>Post your legal case and let our AI classify it automatically. Connect with verified lawyers specializing in your exact legal need — securely, transparently, and efficiently.</p>
        
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register" className="nav-btn primary-btn" style={{ padding: '0.875rem 2rem', background: 'var(--primary)', color: '#0A0F1D', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(217, 160, 91, 0.4)' }}>
            ⚡ Get Started Free
          </Link>
          <Link to="/register" className="nav-btn secondary-btn" style={{ padding: '0.875rem 2rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(217, 160, 91, 0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
            ⚖️ Join as Lawyer
          </Link>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">10+</span>
            <span className="stat-label">Legal Categories</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">AI</span>
            <span className="stat-label">Case Classification</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Platform Access</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Secure & Private</span>
          </div>
        </div>
      </div>

      <section className="section-padding" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="section-header">
          <h2>Powerful Features</h2>
          <p>Our platform combines cutting-edge AI with legal expertise to provide the smartest legal assistance experience.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#A855F7' }}>🧠</div>
            <h3>AI Case Classification</h3>
            <p>NLP-powered system automatically classifies your legal case into the right category with high accuracy.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#3B82F6' }}>🔍</div>
            <h3>Smart Case Visibility</h3>
            <p>Cases are intelligently matched to lawyers based on their specialization for better outcomes.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#10B981' }}>🛡️</div>
            <h3>Verified Lawyers</h3>
            <p>All lawyers undergo verification ensuring you connect with legitimate legal professionals.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#F59E0B' }}>💬</div>
            <h3>Secure Messaging</h3>
            <p>Private, encrypted communication between clients and verified legal practitioners.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#F97316' }}>👤</div>
            <h3>Profile Management</h3>
            <p>Comprehensive profiles for users and detailed portfolios featuring lawyer specializations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#EF4444' }}>🌐</div>
            <h3>Scalable Platform</h3>
            <p>Cloud-based architecture ensuring fast, reliable access whenever you need legal support.</p>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Three simple steps to connect with the right legal professional for your case.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3>Register & Post Case</h3>
            <p>Create an account and describe your legal issue. Our AI analyzes and classifies it instantly.</p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <h3>AI Matches Lawyers</h3>
            <p>Our intelligent system shows your case to lawyers specializing in the relevant legal area.</p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <h3>Connect & Resolve</h3>
            <p>Review lawyer profiles, message them securely, and choose the best legal representation.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Get Legal Help?</h2>
        <p>Join our AI-powered platform today and connect with verified lawyers who specialize in your exact legal needs.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register" className="nav-btn primary-btn" style={{ padding: '0.875rem 2rem', background: 'var(--primary)', color: '#0A0F1D', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold' }}>
            → Create Free Account
          </Link>
          <Link to="/login" className="nav-btn secondary-btn" style={{ padding: '0.875rem 2rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(217, 160, 91, 0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
            Sign In
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
