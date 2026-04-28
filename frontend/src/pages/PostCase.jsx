import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PostCase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    priority: 'medium',
    isPublic: true
  });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classificationPreview, setClassificationPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');

  const availableCategories = [
    'Criminal Law', 'Civil Law', 'Family Law', 'Corporate Law',
    'Property Law', 'Labor Law', 'Constitutional Law', 'Tax Law',
    'Consumer Law', 'Cyber Law', 'Immigration Law', 'Environmental Law', 'Other'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    setDocuments(Array.from(e.target.files));
  };

  const getPreview = async () => {
    if (!formData.title && !formData.description) return;
    
    setPreviewLoading(true);
    try {
      const res = await api.post('/cases/classify', {
        title: formData.title,
        description: formData.description
      });
      setClassificationPreview(res.data.data);
      if (!formData.category && res.data.data.labels?.length > 0) {
        setFormData(prev => ({ ...prev, category: res.data.data.labels[0].label }));
      }
      if (res.data.data.suggestedPriority) {
        setFormData(prev => ({ ...prev, priority: res.data.data.suggestedPriority }));
      }
    } catch (err) {
      console.error('Classification error', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('location', formData.location);
      submitData.append('priority', formData.priority);
      submitData.append('isPublic', formData.isPublic);
      
      if (formData.category) {
        submitData.append('category', formData.category);
      }

      documents.forEach(doc => {
        submitData.append('documents', doc);
      });

      // We need to set multipart/form-data specifically for this request
      const res = await api.post('/cases', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate(`/cases/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post case');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--secondary)' }}>Post a New Legal Case</h1>
        <p style={{ color: 'var(--text-muted)' }}>Describe your situation. Our AI will help classify it to reach the right lawyers.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          {error && <div style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid #FCA5A5' }}>{error}</div>}
          
          <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Case Title</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                onBlur={getPreview}
                required 
                placeholder="e.g. Property dispute with builder regarding delayed possession"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Case Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                onBlur={getPreview}
                required 
                rows="8"
                placeholder="Provide as much detail as possible. Do not include sensitive personal information like bank accounts or SSN."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Location (City/State)</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. Mumbai, MH"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Priority</label>
                <select 
                  name="priority" 
                  value={formData.priority} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'white' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Category override (Optional)</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'white' }}
              >
                <option value="">-- Let AI Decide --</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Supporting Documents (Up to 5)</label>
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                style={{ width: '100%', padding: '0.75rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>Supported formats: PDF, DOC, Images, TXT. Max 10MB per file.</small>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="isPublic" 
                name="isPublic" 
                checked={formData.isPublic} 
                onChange={handleChange} 
              />
              <label htmlFor="isPublic">Make this case publicly visible to all verified lawyers</label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '1.125rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '1rem' }}
            >
              {loading ? 'Posting Case...' : 'Submit Case'}
            </button>
          </form>
        </div>

        {/* AI Analysis Sidebar */}
        <div style={{ background: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #C7D2FE', position: 'sticky', top: '100px' }}>
          <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            ✨ AI Insights
          </h3>
          
          {previewLoading ? (
            <div style={{ color: 'var(--text-muted)' }}>Analyzing text...</div>
          ) : classificationPreview ? (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Predicted Categories</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {classificationPreview.labels.map((lbl, i) => (
                    <div key={i} style={{ background: 'white', padding: '0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{lbl.label}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>{lbl.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Suggested Priority</p>
                <div style={{ display: 'inline-block', background: 'white', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.875rem', textTransform: 'capitalize', fontWeight: '600', border: '1px solid var(--border)' }}>
                  {classificationPreview.suggestedPriority}
                </div>
              </div>

              {classificationPreview.entities?.legalSections?.length > 0 && (
                <div>
                  <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>Detected Legal References</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {classificationPreview.entities.legalSections.map((sec, i) => (
                      <span key={i} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Start typing your title and description to see real-time AI classification and insights.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCase;
