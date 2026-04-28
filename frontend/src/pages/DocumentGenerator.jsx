import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const DocumentGenerator = () => {
  const { showToast } = useToast();
  const [docType, setDocType] = useState('affidavit');
  const [loading, setLoading] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const [affidavitData, setAffidavitData] = useState({
    fullName: '',
    parentName: '',
    age: '',
    address: '',
    location: '',
    points: ['That I am a citizen of India.', 'That the facts stated herein are true.']
  });

  const [rentData, setRentData] = useState({
    agreementDate: new Date().toISOString().split('T')[0],
    landlordName: '',
    landlordAddress: '',
    tenantName: '',
    tenantAddress: '',
    propertyAddress: '',
    monthlyRent: '',
    securityDeposit: '',
    durationMonths: '11'
  });

  const handleAddField = () => {
    setAffidavitData({ ...affidavitData, points: [...affidavitData.points, ''] });
  };

  const handlePointChange = (index, value) => {
    const newPoints = [...affidavitData.points];
    newPoints[index] = value;
    setAffidavitData({ ...affidavitData, points: newPoints });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = docType === 'affidavit' ? affidavitData : rentData;
      const res = await api.post('/documents/generate', { type: docType, data });
      setGeneratedDoc(res.data.data);
      showToast('Document generated successfully!', 'success');
    } catch (err) {
      showToast('Failed to generate document', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Legal Document Generator</h1>
          <p style={{ color: 'var(--text-muted)' }}>Draft binding legal documents in seconds with our automated templates.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', justifyContent: 'center' }}>
          <button 
            onClick={() => { setDocType('affidavit'); setGeneratedDoc(null); }}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: docType === 'affidavit' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: docType === 'affidavit' ? 'white' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer' }}
          >
            📜 General Affidavit
          </button>
          <button 
            onClick={() => { setDocType('rent_agreement'); setGeneratedDoc(null); }}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: docType === 'rent_agreement' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: docType === 'rent_agreement' ? 'white' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer' }}
          >
            🏠 Rent Agreement
          </button>
        </div>

        {generatedDoc ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
            <h2 style={{ color: '#10B981', marginBottom: '1rem' }}>Document Ready!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Your {docType.replace('_', ' ')} has been generated and is ready for download.</p>
            <a 
              href={`http://localhost:5000${generatedDoc.url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '1.25rem 2.5rem', background: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '0.75rem', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 4px 14px rgba(217, 160, 91, 0.4)' }}
            >
              Download PDF
            </a>
            <button 
              onClick={() => setGeneratedDoc(null)}
              style={{ display: 'block', margin: '1.5rem auto 0', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Generate Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleGenerate}>
            {docType === 'affidavit' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Full Name (Deponent)</label>
                    <input type="text" required value={affidavitData.fullName} onChange={(e) => setAffidavitData({...affidavitData, fullName: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Father/Husband Name</label>
                    <input type="text" required value={affidavitData.parentName} onChange={(e) => setAffidavitData({...affidavitData, parentName: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Age</label>
                    <input type="number" required value={affidavitData.age} onChange={(e) => setAffidavitData({...affidavitData, age: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Execution Place (City)</label>
                    <input type="text" required value={affidavitData.location} onChange={(e) => setAffidavitData({...affidavitData, location: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Residential Address</label>
                  <input type="text" required value={affidavitData.address} onChange={(e) => setAffidavitData({...affidavitData, address: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                </div>
                
                <div className="form-group">
                  <label style={{ fontWeight: '600', marginBottom: '1rem', display: 'block' }}>Statement Points</label>
                  {affidavitData.points.map((point, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ padding: '0.85rem 0', fontWeight: '800', color: 'var(--primary)' }}>{idx + 1}.</span>
                      <input type="text" required value={point} onChange={(e) => handlePointChange(idx, e.target.value)} style={{ flex: 1, padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                    </div>
                  ))}
                  <button type="button" onClick={handleAddField} style={{ background: 'rgba(217, 160, 91, 0.1)', color: 'var(--primary)', border: '1px dashed var(--primary)', padding: '0.75rem', width: '100%', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>+ Add Statement Point</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Landlord Name</label>
                    <input type="text" required value={rentData.landlordName} onChange={(e) => setRentData({...rentData, landlordName: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Tenant Name</label>
                    <input type="text" required value={rentData.tenantName} onChange={(e) => setRentData({...rentData, tenantName: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Property Address to be Rented</label>
                  <input type="text" required value={rentData.propertyAddress} onChange={(e) => setRentData({...rentData, propertyAddress: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Monthly Rent (₹)</label>
                    <input type="number" required value={rentData.monthlyRent} onChange={(e) => setRentData({...rentData, monthlyRent: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Security Deposit (₹)</label>
                    <input type="number" required value={rentData.securityDeposit} onChange={(e) => setRentData({...rentData, securityDeposit: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Duration (Months)</label>
                    <input type="number" required value={rentData.durationMonths} onChange={(e) => setRentData({...rentData, durationMonths: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                  </div>
                </div>
                <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Agreement Date</label>
                    <input type="date" required value={rentData.agreementDate} onChange={(e) => setRentData({...rentData, agreementDate: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '1.1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '2.5rem', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(217, 160, 91, 0.4)' }}
            >
              {loading ? 'Processing Document...' : `Generate ${docType.replace('_', ' ').toUpperCase()}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DocumentGenerator;
