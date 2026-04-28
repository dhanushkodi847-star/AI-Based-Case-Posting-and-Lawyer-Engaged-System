import { Routes, Route, Link, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import DashboardLayout from './components/DashboardLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import PostCase from './pages/PostCase'
import MyCases from './pages/MyCases'
import CaseDetail from './pages/CaseDetail'
import BrowseLawyers from './pages/BrowseLawyers'
import BrowseCases from './pages/BrowseCases'
import Messages from './pages/Messages'
import AdminDashboard from './pages/AdminDashboard'
import BookAppointment from './pages/BookAppointment'
import Appointments from './pages/Appointments'
import VideoCall from './pages/VideoCall'
import PaymentProcess from './pages/PaymentProcess'
import PaymentHistory from './pages/PaymentHistory'
import DocumentGenerator from './pages/DocumentGenerator'
import PaymentPage from './pages/PaymentPage'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

// Public layout containing the top navbar and footer for landing/auth pages
const PublicLayout = () => (
  <div className="app-container">
    <Navbar />
    <main className="main-content" style={{ padding: '0', maxWidth: '100%' }}>
      <Outlet />
    </main>
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-col" style={{ gridColumn: 'span 2' }}>
          <div className="logo" style={{ marginBottom: '1rem', background: 'transparent', padding: 0, border: 'none', display: 'flex', gap: '0.5rem', color: '#F8D9A3', fontWeight: '800', fontSize: '1.5rem', alignItems: 'center' }}>
              ⚖️ Legal<span style={{ color: 'var(--text-main)' }}>AI</span>
          </div>
          <p style={{ maxWidth: '400px', lineHeight: 1.6 }}>AI-Based Case Posting and Lawyer Engagement System. Connecting people with the right legal professionals using AI and NLP technology.</p>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          <ul>
            <li><Link to="/register">Post a Case</Link></li>
            <li><Link to="/register">Join as Lawyer</Link></li>
            <li><Link to="/login">Sign In</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Legal Areas</h4>
          <ul>
            <li><Link to="/register">Criminal Law</Link></li>
            <li><Link to="/register">Civil Law</Link></li>
            <li><Link to="/register">Family Law</Link></li>
            <li><Link to="/register">Corporate Law</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 LegalAI Case Label & Lawyer Engagement System. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Public Routes with Top Navbar and Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <Login />
          </div>
        } />
        <Route path="/register" element={
          <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <Register />
          </div>
        } />
      </Route>

      {/* Authenticated Dashboard Routes with Top Navbar Layout */}
      <Route element={<DashboardLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/cases/post" element={<PostCase />} />
          <Route path="/dashboard" element={<MyCases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/lawyers" element={<BrowseLawyers />} />
          <Route path="/lawyer/dashboard" element={<BrowseCases />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/book/:lawyerId" element={<BookAppointment />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/:id" element={<Appointments />} />
          <Route path="/video-call/:appointmentId" element={<VideoCall />} />
          <Route path="/checkout/:transactionId" element={<PaymentProcess />} />
          <Route path="/payment/:caseId" element={<PaymentPage />} />
          <Route path="/payments" element={<PaymentHistory />} />
          <Route path="/documents" element={<DocumentGenerator />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
