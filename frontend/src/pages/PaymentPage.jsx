import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PaymentModal from '../components/PaymentModal';

const PaymentPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const amount = 1500;

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const { data } = await api.get(`/cases/${caseId}`);
        setCaseDetails(data.data);
      } catch (err) {
        setError('Failed to fetch case details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [caseId]);

  const handlePayNow = async () => {
    setIsProcessing(true);
    try {
      const { data } = await api.post(
        '/payments/create-order',
        { caseId, userId: user._id, amount }
      );
      
      if (data.success) {
        setPaymentId(data.data._id);
        setModalOpen(true);
      }
    } catch (err) {
      showToast('Error initiating payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Notify backend to verify and update case status
      await api.post('/payments/verify', {
        paymentId,
        status: 'success'
      });
      
      showToast('Payment Successful! Case updated.', 'success');
      setModalOpen(false);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      showToast('Payment verified but status update failed. Please contact support.', 'warning');
      setModalOpen(false);
    }
  };

  const handlePaymentFailure = () => {
    showToast('Payment Failed. Please try again.', 'error');
    setModalOpen(false);
  };

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading payment details...</div>;
  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;
  if (!caseDetails) return <div className="text-center mt-20">No case found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6">
          <h2 className="text-3xl font-extrabold text-white">Consultancy Fee Payment</h2>
          <p className="mt-2 text-indigo-100">Complete your payment to proceed with the legal consultation.</p>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Side: Case Info */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Case Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Case Title</p>
                  <p className="font-semibold text-slate-800">{caseDetails.title}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Client Name</p>
                  <p className="font-semibold text-slate-800">{user?.name || 'Client'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <span className="inline-block mt-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                    {caseDetails.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Payment Summary */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Payment Summary</h3>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-600">Consultation Fee</span>
                <span className="font-semibold text-slate-800">₹{amount}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-600">GST (18%)</span>
                <span className="font-semibold text-slate-800 text-sm italic">Inclusive</span>
              </div>
              
              <div className="border-t border-slate-300 my-4"></div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-bold text-slate-800">Total</span>
                <span className="text-2xl font-black text-indigo-600">₹{amount}</span>
              </div>

              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className={`w-full py-4 px-4 rounded-xl font-bold text-white shadow-lg transition transform ${
                  isProcessing 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-indigo-500/30'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </button>
              
              <p className="text-xs text-center text-slate-500 mt-4 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/></svg>
                Secure Simulated Payment Gateway
              </p>
            </div>

          </div>
        </div>
      </div>

      <PaymentModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        paymentId={paymentId} 
        amount={amount} 
        onSuccess={handlePaymentSuccess} 
        onFailure={handlePaymentFailure} 
      />
    </div>
  );
};

export default PaymentPage;
