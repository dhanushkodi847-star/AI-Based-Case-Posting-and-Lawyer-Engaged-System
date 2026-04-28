import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CaseCard = ({ caseItem, isLawyerView = false, onInterestClick }) => {
  const { user } = useAuth();
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'var(--success)';
      case 'assigned': return 'var(--primary)';
      case 'in-progress': return 'var(--warning)';
      case 'resolved': return 'var(--info)';
      case 'closed': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'var(--danger)';
      case 'high': return 'var(--warning)';
      case 'medium': return 'var(--info)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--secondary)', margin: 0 }}>
          <Link autoFocus={false} to={`/cases/${caseItem._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {caseItem.title}
          </Link>
        </h3>
        <span style={{ backgroundColor: getStatusColor(caseItem.status) + '20', color: getStatusColor(caseItem.status), padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
          {caseItem.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <strong>Category:</strong> {caseItem.category}
        </span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <strong>Priority:</strong> <span style={{ color: getPriorityColor(caseItem.priority), fontWeight: '600', textTransform: 'capitalize' }}>{caseItem.priority}</span>
        </span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <strong>Location:</strong> {caseItem.location || 'Not specified'}
        </span>
      </div>

      {caseItem.aiLabels && caseItem.aiLabels.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600' }}>AI Predicted Topics:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {caseItem.aiLabels.map((lbl, idx) => (
              <span key={idx} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                {lbl.label} ({lbl.confidence}%)
              </span>
            ))}
          </div>
        </div>
      )}

      <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {caseItem.description}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Posted {new Date(caseItem.createdAt).toLocaleDateString()}
        </span>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/cases/${caseItem._id}`} className="nav-btn secondary-btn" style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.875rem' }}>
            View Details
          </Link>
          
          {isLawyerView && caseItem.status === 'open' && (
            <button 
              onClick={() => onInterestClick(caseItem)}
              className="nav-btn primary-btn" 
              style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Express Interest
            </button>
          )}

          {!isLawyerView && user?.role === 'client' && caseItem.interestedLawyers?.length > 0 && (
             <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>
               {caseItem.interestedLawyers.length} Interested
             </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseCard;
