import { useState, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './PostCaseModal.css';

const PostCaseModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', location: '' });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('priority', formData.priority);
      data.append('location', formData.location);

      Array.from(attachments).forEach(file => {
        data.append('documents', file);
      });

      await api.post('/cases', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('Case analyzed and posted successfully!', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post case.', 'error');
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal-backdrop') {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>Post New Case</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Case Title</label>
            <input 
              type="text" 
              placeholder="Brief title for your case" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              placeholder="Describe your legal issue in detail. Our AI will analyze this to classify your case..."
              rows="4"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent / Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                placeholder="City, State" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Attachments (Proofs/Documents)</label>
            <div className="file-input-wrapper">
              <input 
                type="file" 
                multiple 
                onChange={e => setAttachments(e.target.files)}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <button 
                type="button" 
                className="file-btn"
                onClick={() => fileInputRef.current.click()}
              >
                Choose Files
              </button>
              <span className="file-name">
                {attachments.length > 0 ? `${attachments.length} file(s) chosen` : 'No file chosen'}
              </span>
            </div>
          </div>

          <button type="submit" className="modal-submit-btn" disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            {loading ? 'Analyzing & Posting...' : 'Post & Classify with AI'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostCaseModal;
