import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import ReviewForm from '../components/ReviewForm';
import AddHearingModal from '../components/AddHearingModal';
import ReviewsModal from '../components/ReviewsModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [interestLoading, setInterestLoading] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
  const [showHearingModal, setShowHearingModal] = useState(false);
  const [hearingLoading, setHearingLoading] = useState(false);
  const [reviewModalLawyerId, setReviewModalLawyerId] = useState(null);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const res = await api.get(`/cases/${id}`);
        setCaseItem(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to view case details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [id]);

  const handleExpressInterest = async (e) => {
    e.preventDefault();
    setInterestLoading(true);
    try {
      const res = await api.post(`/lawyers/interest/${id}`, { message: interestMessage });
      setCaseItem(res.data.data);
      setShowInterestModal(false);
      setInterestMessage('');
      showToast('Interest expressed successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to express interest', 'error');
    } finally {
      setInterestLoading(false);
    }
  };

  const handleAssignLawyer = async (lawyerId) => {
    setConfirmState({
      isOpen: true,
      title: 'Assign Counsel',
      message: 'Are you sure you want to assign this lawyer? This will lock the case to them and notify all other interested parties.',
      type: 'info',
      onConfirm: async () => {
        try {
          await api.put(`/cases/${id}/assign`, { lawyerId });
          // Re-fetch case details to update the UI with the assigned lawyer
          const res = await api.get(`/cases/${id}`);
          setCaseItem(res.data.data);
          showToast('Lawyer assigned successfully!', 'success');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to assign lawyer', 'error');
        } finally {
          setConfirmState({ ...confirmState, isOpen: false });
        }
      }
    });
  };

  const handleUpdateStatus = async (newStatus, messagePrefix) => {
    setConfirmState({
      isOpen: true,
      title: 'Update Case Progress',
      message: `Are you sure you want to move this case to "${newStatus}"? This will notify the client.`,
      type: 'info',
      onConfirm: async () => {
        try {
          await api.put(`/cases/${id}/status`, { status: newStatus });
          const res = await api.get(`/cases/${id}`);
          setCaseItem(res.data.data);
          showToast(`${messagePrefix || 'Status updated'} successfully!`, 'success');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to update status', 'error');
        } finally {
          setConfirmState({ ...confirmState, isOpen: false });
        }
      }
    });
  };

  const handleAddHearing = async (hearingData) => {
    setHearingLoading(true);
    try {
      await api.post(`/cases/${id}/court-date`, hearingData);
      
      // Crucial: Re-fetch the entire populated Case cleanly so UI variables like 'assignedLawyer.name' don't crash
      const freshRes = await api.get(`/cases/${id}`);
      setCaseItem(freshRes.data.data);
      
      setShowHearingModal(false);
      showToast('Court date officially scheduled!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule hearing', 'error');
    } finally {
      setHearingLoading(false);
    }
  };
 
  const handleMessageLawyer = (lawyerId) => {
    navigate(`/messages?lawyerId=${lawyerId}`);
  };

  const generatePDF = async () => {
    const reportElement = document.getElementById('case-report-container');
    if (!reportElement) return;

    try {
      showToast('Generating PDF Report... Please wait.', 'info');
      
      const canvas = await html2canvas(reportElement, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#0A0F1D', // Preserve dark mode theme beautifully in the PDF
        windowWidth: 1000
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`Case_Report_${caseItem.title.replace(/\s+/g, '_')}.pdf`);
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF.', 'error');
    }
  };

  const hasExpressedInterest = user?.role === 'lawyer' && caseItem?.interestedLawyers?.some(il => il.lawyer?._id === user._id);
  const isOwner = user?._id === caseItem?.postedBy?._id || user?.role === 'admin';

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>⏳ Analyzing Case Assets...</div>;
  if (error || !caseItem) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error || 'Case not found'}</div>;

  const steps = [
    { label: 'Posted', status: 'posted' },
    { label: 'Accepted', status: 'accepted' },
    { label: 'In Progress', status: 'in-progress' },
    { label: 'Closed', status: 'closed' }
  ];

  const getCurrentStepIdx = () => {
    if (caseItem.status === 'open' || caseItem.status === 'posted') return 0;
    if (caseItem.status === 'assigned' || caseItem.status === 'accepted') return 1;
    if (caseItem.status === 'in-progress') return 2;
    if (caseItem.status === 'resolved' || caseItem.status === 'closed') return 3;
    return 0;
  };

  const currentStep = getCurrentStepIdx();

  return (
    <div id="case-report-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem', backgroundColor: '#0A0F1D', borderRadius: '12px' }}>
      <button 
        data-html2canvas-ignore="true"
        onClick={() => navigate(-1)} 
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        ← Back
      </button>

      {/* Visual Progress Stepper */}
      <div style={{ marginBottom: '2.5rem', padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {/* Progress Line Background */}
          <div style={{ position: 'absolute', top: '20px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>
          {/* Active Progress Line */}
          <div style={{ 
            position: 'absolute', top: '20px', left: '10%', 
            width: `${(currentStep / (steps.length - 1)) * 80}%`, 
            height: '2px', background: currentStep === steps.length - 1 ? '#10B981' : 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', 
            zIndex: 0, transition: 'background 0.3s ease, width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}></div>

          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep || (idx === steps.length - 1 && currentStep === steps.length - 1);
            const isActive = idx === currentStep && currentStep !== steps.length - 1;
            const isFuture = idx > currentStep;

            return (
              <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '80px' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: isActive ? '#D9A05B' : isCompleted ? '#10B981' : '#0A0F1D',
                  border: `2px solid ${isActive || isCompleted ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                  color: isActive || isCompleted ? '#0A0F1D' : 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: '800', transition: 'all 0.4s ease'
                }}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span style={{ 
                  fontSize: '0.65rem', fontWeight: isActive ? '800' : '600', 
                  color: isActive ? '#D9A05B' : isCompleted ? '#10B981' : 'rgba(255,255,255,0.2)',
                  textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', color: 'var(--secondary)', marginBottom: '0.75rem', lineHeight: '1.2', fontWeight: '800' }}>{caseItem.title}</h1>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Posted on {new Date(caseItem.createdAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {caseItem.location}
              </span>
              <span>•</span>
              <span style={{ textTransform: 'capitalize', color: 'var(--primary)', fontWeight: '700' }}>Priority: {caseItem.priority}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
            <span style={{ backgroundColor: 'rgba(217, 160, 91, 0.1)', color: 'var(--primary)', padding: '0.6rem 1.2rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(217, 160, 91, 0.2)' }}>
              {caseItem.status}
            </span>
            <button 
              data-html2canvas-ignore="true"
              onClick={generatePDF}
              style={{ background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', color: '#0A0F1D', border: 'none', padding: '0.65rem 1rem', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', whiteSpace: 'nowrap', transition: 'transform 0.1s' }}
              onMouseDown={e => e.target.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.target.style.transform = 'scale(1)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download PDF Report
            </button>
          </div>
        </div>

        {/* AI Analysis Section */}
        {caseItem.aiLabels && caseItem.aiLabels.length > 0 && (
          <div style={{ marginBottom: '2.5rem', padding: '1.75rem', background: '#0F172A', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1.125rem', color: '#D9A05B', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700' }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span> AI Classification Results
            </h3>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {caseItem.aiLabels.map((lbl, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem' }}>{lbl.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Match Confidence:
                      <span style={{ background: 'rgba(217, 160, 91, 0.15)', color: '#D9A05B', padding: '0.2rem 0.6rem', borderRadius: '2rem', fontWeight: '800' }}>
                        {lbl.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ opacity: 0.6 }}>Primary Category:</span> <strong style={{ color: '#D9A05B', fontWeight: '800' }}>{caseItem.category}</strong>
            </p>
          </div>
        )}

        {/* Case Content */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--secondary)', marginBottom: '1.25rem', fontWeight: '700' }}>Case Details</h3>
          <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', lineHeight: '1.8', whiteSpace: 'pre-wrap', opacity: 0.9 }}>
            {caseItem.description}
          </p>
        </div>

        {/* Documents */}
        {caseItem.documents && caseItem.documents.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.125rem', color: 'var(--secondary)', marginBottom: '1.25rem', fontWeight: '700' }}>Attached Documents</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {caseItem.documents.map((doc, idx) => (
                <a 
                  key={idx} 
                  href={`http://localhost:5000/uploads/${doc.filename}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.9rem', transition: 'all 0.2s', fontWeight: '500' }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <span style={{ fontSize: '1.2rem' }}>📄</span> {doc.originalName}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Client / Owner info */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(217, 160, 91, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.4rem', border: '1px solid rgba(217, 160, 91, 0.2)' }}>
              {caseItem.postedBy?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '700', color: 'var(--secondary)', fontSize: '1.1rem' }}>{caseItem.postedBy?.name || 'Anonymous'}</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Posted this case</p>
            </div>
          </div>
        </div>

        {/* Lawyer Actions */}
        {user?.role === 'lawyer' && !isOwner && caseItem.status === 'open' && (
          <div data-html2canvas-ignore="true" style={{ borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
            {hasExpressedInterest ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.05)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span style={{ fontWeight: '700' }}>Interest Expressed Successfully</span>
              </div>
            ) : (
              <button 
                onClick={() => setShowInterestModal(true)}
                style={{ width: '100%', background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', color: '#0A0F1D', padding: '1rem', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.1rem' }}
                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                Express Interest to Handle This Case
              </button>
            )}
          </div>
        )}

        {/* Interested Lawyers Grid (Client View) */}
        {isOwner && caseItem.status === 'open' && caseItem.interestedLawyers?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '1.25rem', color: 'var(--secondary)', marginBottom: '1.5rem', fontWeight: '800' }}>Interested Lawyers ({caseItem.interestedLawyers.length})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {caseItem.interestedLawyers.map((il) => (
                <div key={il._id} style={{ background: '#0F172A', padding: '1.75rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(217, 160, 91, 0.1)', color: '#D9A05B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', border: '1px solid rgba(217, 160, 91, 0.2)' }}>
                      {il.lawyer?.name?.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: '800', margin: 0, color: 'var(--secondary)', fontSize: '1.1rem' }}>{il.lawyer?.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verified Expert</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ color: '#F59E0B', fontSize: '0.9rem' }}>★</span>
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>{il.lawyer?.averageRating || '0.0'}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({il.lawyer?.totalReviews || 0})</span>
                        {(il.lawyer?.totalReviews || 0) > 0 && (
                          <button
                            onClick={() => setReviewModalLawyerId(il.lawyer?._id)}
                            style={{ background: 'none', border: 'none', color: '#D9A05B', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginLeft: '0.3rem', fontWeight: '600' }}
                          >
                            View Feedback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.6', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.04)', fontStyle: 'italic' }}>
                    "{il.message}"
                  </p>
                  <div data-html2canvas-ignore="true" style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={() => handleMessageLawyer(il.lawyer?._id)}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Message
                    </button>
                    <button 
                      onClick={() => navigate(`/book/${il.lawyer?._id}?caseId=${caseItem._id}`)}
                      style={{ flex: 1, background: 'rgba(217, 160, 91, 0.1)', color: '#D9A05B', padding: '0.75rem', border: '1px solid rgba(217, 160, 91, 0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '700' }}
                    >
                      Book
                    </button>
                    <button 
                      onClick={() => handleAssignLawyer(il.lawyer?._id)}
                      style={{ flex: 1.2, background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', color: '#0A0F1D', padding: '0.75rem', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '800' }}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success / Assigned message */}
        {caseItem.assignedLawyer && (
          <div style={{ 
            marginTop: '1rem', 
            width: '100%', 
            padding: '2.5rem', 
            background: (caseItem.status === 'resolved' || caseItem.status === 'closed') ? 'rgba(139, 92, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)', 
            borderRadius: 'var(--radius-xl)', 
            border: (caseItem.status === 'resolved' || caseItem.status === 'closed') ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)', 
            textAlign: 'center' 
          }}>
            <div style={{ 
              width: '60px', height: '60px', 
              background: (caseItem.status === 'resolved' || caseItem.status === 'closed') ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
              color: (caseItem.status === 'resolved' || caseItem.status === 'closed') ? '#A78BFA' : '#10B981', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' 
            }}>
              {(caseItem.status === 'resolved' || caseItem.status === 'closed') ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
            </div>
            
            <h4 style={{ color: (caseItem.status === 'resolved' || caseItem.status === 'closed') ? '#A78BFA' : '#10B981', fontSize: '1.75rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>
              {(caseItem.status === 'resolved' || caseItem.status === 'closed') ? 'Case Successfully Resolved' : 'Case Officially Assigned'}
            </h4>
            
            <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '500' }}>
              {(caseItem.status === 'resolved' || caseItem.status === 'closed') ? 'This case has been completed by' : 'Counsel:'} <strong style={{ color: 'white' }}>{caseItem.assignedLawyer.name}</strong>
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '2rem' }}>
              <span style={{ color: '#F59E0B', fontSize: '1.1rem' }}>★</span>
              <span style={{ color: 'white', fontWeight: '800', fontSize: '1rem' }}>{caseItem.assignedLawyer.averageRating || '0.0'}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>({caseItem.assignedLawyer.totalReviews || 0} reviews)</span>
              {(caseItem.assignedLawyer.totalReviews || 0) > 0 && (
                <button
                  onClick={() => setReviewModalLawyerId(caseItem.assignedLawyer._id)}
                  style={{ background: 'none', border: 'none', color: '#D9A05B', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginLeft: '0.5rem', fontWeight: '700' }}
                >
                  View Feedback
                </button>
              )}
            </div>

            <div data-html2canvas-ignore="true" style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center' }}>
              <button 
                onClick={() => navigate('/messages')}
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.85rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                Chat with Lawyer
              </button>

              {isOwner && caseItem.status !== 'closed' && caseItem.status !== 'resolved' && (
                <button 
                  onClick={() => handleUpdateStatus('resolved', 'Case resolved')}
                  style={{ background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)', color: 'white', padding: '0.85rem 2.5rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
                >
                  Mark as Resolved
                </button>
              )}
            </div>

            {/* Lawyer-only status controls */}
            {user?.role === 'lawyer' && caseItem.assignedLawyer?._id === user._id && caseItem.status !== 'closed' && (
              <div data-html2canvas-ignore="true" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', background: 'rgba(217, 160, 91, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(217, 160, 91, 0.1)' }}>
                {(caseItem.status === 'accepted' || caseItem.status === 'assigned') && (
                  <button onClick={() => handleUpdateStatus('in-progress', 'Case started')} style={{ background: '#D9A05B', color: '#0A0F1D', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer', transition: 'box-shadow 0.2s' }} onMouseOver={e => e.target.style.boxShadow = '0 0 10px rgba(217, 160, 91, 0.6)'} onMouseOut={e => e.target.style.boxShadow = 'none'}>
                    Start Working
                  </button>
                )}
                {caseItem.status === 'in-progress' && (
                  <button onClick={() => handleUpdateStatus('resolved', 'Case complete')} style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer', transition: 'box-shadow 0.2s' }} onMouseOver={e => e.target.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.6)'} onMouseOut={e => e.target.style.boxShadow = 'none'}>
                    Finalize Work
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Review Form for resolved cases */}
        {isOwner && (caseItem.status === 'resolved' || caseItem.status === 'closed') && (
          <div data-html2canvas-ignore="true">
            <ReviewForm 
              caseId={caseItem._id} 
              lawyerId={caseItem.assignedLawyer?._id}
              onSuccess={() => {
                const fetchCase = async () => {
                  const res = await api.get(`/cases/${id}`);
                  setCaseItem(res.data.data);
                };
                fetchCase();
              }}
            />
          </div>
        )}
      </div>

      {/* Express Interest Modal */}
      {showInterestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111827', padding: '2.5rem', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '540px', margin: '1rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--secondary)', marginBottom: '1rem', fontWeight: '800' }}>Express Interest</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.6' }}>Send a professional message to the client. Introduce yourself and explain how your expertise aligns with their specific case needs.</p>
            
            <form onSubmit={handleExpressInterest}>
              <textarea 
                value={interestMessage}
                onChange={(e) => setInterestMessage(e.target.value)}
                placeholder="I have excessive experience in Property Law and have handled similar cases in Chennai..."
                required
                rows="5"
                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', color: 'white', fontFamily: 'inherit', resize: 'vertical', marginBottom: '2rem', fontSize: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInterestModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', padding: '0 1rem' }}>Cancel</button>
                <button type="submit" disabled={interestLoading} style={{ background: 'linear-gradient(90deg, #D9A05B 0%, #E8B475 100%)', color: '#0A0F1D', padding: '0.75rem 2rem', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '800', cursor: interestLoading ? 'not-allowed' : 'pointer', opacity: interestLoading ? 0.7 : 1 }}>
                  {interestLoading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
        confirmText="Confirm Action"
      />
      {/* Court Dates Section */}
      {(caseItem.assignedLawyer || isOwner) && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--secondary)', margin: 0, fontWeight: '800' }}>⚖️ Court Proceedings & Deadlines</h3>
            {user?.role === 'lawyer' && caseItem.assignedLawyer?._id === user._id && (
              <button 
                data-html2canvas-ignore="true"
                onClick={() => setShowHearingModal(true)}
                style={{ background: 'rgba(217, 160, 91, 0.1)', color: 'var(--primary)', border: '1px solid rgba(217, 160, 91, 0.2)', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseOver={(e) => { e.target.style.background='rgba(217, 160, 91, 0.2)'; e.target.style.transform='scale(1.02)'; }}
                onMouseOut={(e) => { e.target.style.background='rgba(217, 160, 91, 0.1)'; e.target.style.transform='scale(1)'; }}
              >
                + Add Hearing
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {caseItem.courtDates && caseItem.courtDates.length > 0 ? (
              caseItem.courtDates.sort((a,b) => new Date(a.date) - new Date(b.date)).map((cd, idx) => (
                <div key={idx} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'white' }}>{cd.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{cd.description}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: '#D9A05B' }}>{new Date(cd.date).toLocaleDateString()}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(cd.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
                No hearings scheduled for this case yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hearing Creation Modal */}
      <AddHearingModal 
        isOpen={showHearingModal}
        onClose={() => setShowHearingModal(false)}
        onSubmit={handleAddHearing}
        loading={hearingLoading}
      />

      {/* Reviews Modal */}
      {reviewModalLawyerId && (
        <ReviewsModal 
          lawyerId={reviewModalLawyerId} 
          onClose={() => setReviewModalLawyerId(null)} 
        />
      )}
    </div>
  );
};

export default CaseDetail;
