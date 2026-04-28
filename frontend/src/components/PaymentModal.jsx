import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

const stripePromise = loadStripe('pk_test_51TH1jRAwIK3ao8NiNmbvdMP5WZ8O00pK74PvCl4b40jpfmB50zI8GQqePddevnC5roxxLVffntKEtInHRR1f7t7y00X3InfJrx');

/* ====== Global Animation Styles ====== */
const GLOBAL_CSS = `
  @keyframes pmSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes pmFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pmScalePop { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  @keyframes pmPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes pmShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes pmFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  @keyframes pmGlow { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)} 50%{box-shadow:0 0 0 8px rgba(99,102,241,0)} }
`;

/* ====== Shared UI Styles ====== */
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";
const OVERLAY = {
  position:'fixed',top:0,left:0,right:0,bottom:0,
  background:'rgba(15,23,42,0.6)',
  backdropFilter:'blur(12px)',
  WebkitBackdropFilter:'blur(12px)',
  display:'flex',alignItems:'center',justifyContent:'center',
  zIndex:9999,
  fontFamily:FONT,
};
const MODAL = {
  background:'#ffffff',
  borderRadius:24,
  width:'100%',
  maxWidth:460,
  overflow:'hidden',
  boxShadow:'0 32px 64px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.04)',
};

/* ====== SVG Logo Components ====== */
const GPayLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#fff"/>
    <path d="M25.37 24.54v5.3h-1.7v-13.2h4.5c1.08 0 2 .36 2.76 1.08.78.72 1.17 1.6 1.17 2.63 0 1.05-.39 1.93-1.17 2.64-.75.72-1.67 1.07-2.76 1.07h-2.8v.48zm0-6.2v4.02h2.83c.64 0 1.18-.22 1.6-.65.44-.43.66-.96.66-1.56 0-.6-.22-1.12-.65-1.55a2.13 2.13 0 00-1.6-.66h-2.84v.4z" fill="#3C4043"/>
    <path d="M36.28 20.58c1.18 0 2.1.32 2.77.95.68.63 1.01 1.5 1.01 2.6v5.7h-1.62v-1.28h-.07c-.65.98-1.52 1.46-2.6 1.46-.92 0-1.69-.27-2.3-.82a2.59 2.59 0 01-.92-2.02c0-.85.32-1.53.97-2.03.65-.5 1.51-.75 2.6-.75.92 0 1.68.17 2.27.5v-.35c0-.6-.23-1.1-.7-1.52-.46-.42-1-.63-1.6-.63-.93 0-1.66.39-2.2 1.18l-1.5-.94c.8-1.17 1.98-1.75 3.52-1.75h.37zm-2.02 6.56c0 .45.19.83.57 1.13.38.3.82.45 1.33.45.72 0 1.35-.27 1.89-.8.54-.54.81-1.16.81-1.87-.48-.38-1.16-.57-2.03-.57-.63 0-1.16.16-1.58.47-.42.31-.63.7-.63 1.15l-.36.04z" fill="#3C4043"/>
    <path d="M14.47 23.74c0-.43-.04-.86-.1-1.28h-5.5v2.42h3.15c-.14.72-.55 1.34-1.17 1.75v1.45h1.89c1.1-1.02 1.74-2.52 1.74-4.34h-.01z" fill="#4285F4"/>
    <path d="M8.87 28.52c1.58 0 2.91-.52 3.87-1.43l-1.89-1.45c-.52.35-1.19.56-1.98.56-1.52 0-2.81-1.03-3.27-2.41H3.66v1.5a5.84 5.84 0 005.2 3.23h.01z" fill="#34A853"/>
    <path d="M5.6 24.79c-.12-.35-.18-.73-.18-1.12s.06-.77.18-1.12v-1.5H3.66a5.84 5.84 0 000 5.24L5.6 24.8v-.01z" fill="#FBBC04"/>
    <path d="M8.87 20.14c.86 0 1.63.29 2.23.87l1.67-1.67A5.54 5.54 0 008.87 17.5a5.84 5.84 0 00-5.2 3.23l1.94 1.5c.46-1.38 1.75-2.41 3.27-2.41l-.01.32z" fill="#EA4335"/>
  </svg>
);

const PaytmLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#00B9F5"/>
    <path d="M10 17h5.2c2.5 0 4 1.3 4 3.4 0 2.1-1.5 3.4-4 3.4H12.8v4.3H10V17zm2.8 4.8h2c1.1 0 1.6-.5 1.6-1.4 0-.9-.5-1.4-1.6-1.4h-2v2.8z" fill="#fff"/>
    <path d="M38 21.7c0 3.6-2.5 6.6-6 6.6-1.3 0-2.4-.4-3.3-1.1v4.8h-2.8V21.7c0-3.6 2.5-6.6 6-6.6s6.1 3 6.1 6.6zm-2.8 0c0-2.2-1.4-3.8-3.2-3.8s-3.2 1.6-3.2 3.8 1.4 3.8 3.2 3.8 3.2-1.6 3.2-3.8z" fill="#fff"/>
  </svg>
);

const PhonePeLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#5F259F"/>
    <path d="M20 13h5c4.97 0 9 4.03 9 9s-4.03 9-9 9h-1.5v4H20V13zm3.5 3.5v11h1.5c3.04 0 5.5-2.46 5.5-5.5s-2.46-5.5-5.5-5.5h-1.5z" fill="#fff"/>
    <circle cx="21.5" cy="38" r="2" fill="#fff"/>
  </svg>
);

const CardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const UPIIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="3" width="20" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M7 9l3 6h1l3-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 9l3 6h1l-1.5-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ====== UPI Provider Data ====== */
const UPI_PROVIDERS = [
  { id: 'gpay', name: 'Google Pay', short: 'GPay', color: '#34A853', bg: '#e8f5e9', upiId: 'legalai@okicici' },
  { id: 'paytm', name: 'Paytm', short: 'Paytm', color: '#00B9F5', bg: '#e0f7ff', upiId: 'legalai@paytm' },
  { id: 'phonepe', name: 'PhonePe', short: 'PhonePe', color: '#5F259F', bg: '#f3e8ff', upiId: 'legalai@ybl' },
];

const ProviderLogo = ({ id, size = 28 }) => {
  if (id === 'gpay') return <GPayLogo size={size} />;
  if (id === 'paytm') return <PaytmLogo size={size} />;
  if (id === 'phonepe') return <PhonePeLogo size={size} />;
  return null;
};


/* ============================================================
   STRIPE CARD FORM
   ============================================================ */
const StripeCardForm = ({ amount, clientSecret, onSuccess, onFailure, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState('card');
  const [cardReady, setCardReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [txnId, setTxnId] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements || !clientSecret) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setStep('processing');
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card, billing_details: { name: 'Demo User' } },
      });
      if (error) { setErrorMsg(error.message); setStep('failed'); }
      else if (paymentIntent?.status === 'succeeded') {
        setTxnId(paymentIntent.id);
        setStep('success');
        setTimeout(() => onSuccess?.({ stripePaymentId: paymentIntent.id }), 2500);
      }
    } catch (err) { setErrorMsg(err.message || 'Unexpected error.'); setStep('failed'); }
  };

  return (
    <div style={OVERLAY}>
      <style>{GLOBAL_CSS}</style>
      <div style={MODAL}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%)', padding:'28px 28px 24px', color:'#fff', position:'relative' }}>
          {step !== 'processing' && (
            <button onClick={onClose} style={{ position:'absolute',top:18,right:18,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(4px)',border:'none',color:'#fff',width:32,height:32,borderRadius:10,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
            >✕</button>
          )}
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)' }}>
              <CardIcon />
            </div>
            <div>
              <p style={{ margin:0,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.1em',opacity:0.7,fontWeight:600 }}>Secure Card Payment</p>
              <p style={{ margin:0,fontSize:'0.85rem',fontWeight:700 }}>Powered by Stripe</p>
            </div>
          </div>
          <p style={{ fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.12em',opacity:0.6,margin:'0 0 6px',fontWeight:600 }}>Amount to pay</p>
          <h1 style={{ margin:0,fontSize:'2.4rem',fontWeight:900,letterSpacing:'-0.03em' }}>₹{amount}</h1>
        </div>

        <div style={{ padding:'24px 28px 20px' }}>
          {/* Card Input - Always mounted */}
          <div style={{ display: step === 'card' ? 'block' : 'none' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
              <span style={{ color:'#6366f1' }}><CardIcon /></span>
              <span style={{ fontWeight:700,fontSize:'0.8rem',color:'#334155',textTransform:'uppercase',letterSpacing:'0.06em' }}>Card Details</span>
            </div>
            <div style={{ background:'#f8fafc',padding:'18px 16px',borderRadius:14,border:'1px solid #e2e8f0',marginBottom:10 }}>
              <CardElement
                onChange={(e) => setCardReady(e.complete)}
                options={{
                  style:{ base:{ fontSize:'16px',color:'#1e293b','::placeholder':{color:'#94a3b8'},iconColor:'#6366f1',fontFamily:FONT },invalid:{color:'#ef4444'} },
                  hidePostalCode:true
                }}
              />
            </div>
            <p style={{ fontSize:'0.68rem',color:'#94a3b8',marginBottom:20,display:'flex',alignItems:'center',gap:6 }}>
              <span>Test:</span>
              <code style={{ fontFamily:'monospace',color:'#64748b',background:'#f1f5f9',padding:'2px 6px',borderRadius:4,fontSize:'0.68rem' }}>4242 4242 4242 4242</code>
              <code style={{ fontFamily:'monospace',color:'#64748b',background:'#f1f5f9',padding:'2px 6px',borderRadius:4,fontSize:'0.68rem' }}>12/34</code>
              <code style={{ fontFamily:'monospace',color:'#64748b',background:'#f1f5f9',padding:'2px 6px',borderRadius:4,fontSize:'0.68rem' }}>123</code>
            </p>
            <button
              onClick={handlePay}
              disabled={!cardReady}
              style={{
                width:'100%',padding:15,border:'none',borderRadius:14,fontWeight:700,fontSize:'0.95rem',
                cursor:cardReady?'pointer':'not-allowed',color:'#fff',
                background:cardReady?'linear-gradient(135deg,#6366f1,#8b5cf6)':'#e2e8f0',
                boxShadow:cardReady?'0 8px 24px rgba(99,102,241,0.35)':'none',
                transition:'all 0.3s ease',letterSpacing:'0.01em',
              }}
              onMouseEnter={e => { if(cardReady){ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 12px 28px rgba(99,102,241,0.45)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=cardReady?'0 8px 24px rgba(99,102,241,0.35)':'none'; }}
            >
              Pay ₹{amount}
            </button>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:14 }}>
              <ShieldIcon />
              <span style={{ fontSize:'0.68rem',color:'#94a3b8',fontWeight:500 }}>Secured with 256-bit SSL encryption · Test Mode</span>
            </div>
          </div>

          {/* Processing */}
          {step === 'processing' && (
            <div style={{ textAlign:'center',padding:'40px 0',animation:'pmFadeUp 0.3s ease-out' }}>
              <div style={{ position:'relative',width:64,height:64,margin:'0 auto 20px' }}>
                <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:'4px solid #eef2ff' }}/>
                <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:'4px solid transparent',borderTopColor:'#6366f1',animation:'pmSpin 0.9s linear infinite' }}/>
                <div style={{ position:'absolute',inset:10,borderRadius:'50%',background:'#f5f3ff',display:'flex',alignItems:'center',justifyContent:'center',color:'#6366f1' }}><CardIcon /></div>
              </div>
              <h3 style={{ margin:'0 0 6px',fontSize:'1.1rem',fontWeight:700,color:'#1e293b' }}>Processing Payment</h3>
              <p style={{ margin:0,fontSize:'0.85rem',color:'#64748b' }}>Connecting with your bank...</p>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div style={{ textAlign:'center',padding:'32px 0',animation:'pmFadeUp 0.4s ease-out' }}>
              <div style={{ width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#dcfce7,#bbf7d0)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'2rem',animation:'pmScalePop 0.5s ease-out',boxShadow:'0 8px 24px rgba(34,197,94,0.2)' }}>✓</div>
              <h3 style={{ margin:'0 0 4px',fontSize:'1.3rem',fontWeight:800,color:'#16a34a' }}>Payment Successful!</h3>
              <p style={{ margin:'0 0 20px',fontSize:'0.85rem',color:'#64748b' }}>Consultation fee received</p>
              <div style={{ background:'#f8fafc',padding:14,borderRadius:12,border:'1px solid #e2e8f0',textAlign:'left' }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:'0.82rem' }}>
                  <span style={{ color:'#94a3b8' }}>Amount</span>
                  <span style={{ fontWeight:700,color:'#0f172a' }}>₹{amount}</span>
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:'0.82rem',borderTop:'1px solid #f1f5f9',paddingTop:8 }}>
                  <span style={{ color:'#94a3b8' }}>Transaction ID</span>
                  <span style={{ fontFamily:'monospace',fontSize:'0.7rem',color:'#0f172a',fontWeight:600 }}>{txnId}</span>
                </div>
              </div>
            </div>
          )}

          {/* Failed */}
          {step === 'failed' && (
            <div style={{ textAlign:'center',padding:'32px 0',animation:'pmFadeUp 0.4s ease-out' }}>
              <div style={{ width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#fee2e2,#fecaca)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'2rem',animation:'pmScalePop 0.5s ease-out',boxShadow:'0 8px 24px rgba(239,68,68,0.15)' }}>✕</div>
              <h3 style={{ margin:'0 0 4px',fontSize:'1.3rem',fontWeight:800,color:'#dc2626' }}>Payment Failed</h3>
              <p style={{ margin:'0 0 24px',fontSize:'0.85rem',color:'#64748b' }}>{errorMsg}</p>
              <button onClick={() => { setStep('card'); setErrorMsg(''); setCardReady(false); }} style={{ width:'100%',padding:13,background:'#1e293b',color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer',marginBottom:8,transition:'all 0.2s' }}>Retry Payment</button>
              <button onClick={onClose} style={{ width:'100%',padding:10,background:'transparent',color:'#94a3b8',border:'none',fontWeight:600,fontSize:'0.85rem',cursor:'pointer' }}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


/* ============================================================
   UPI PAYMENT FLOW
   ============================================================ */
const UPIPaymentFlow = ({ amount, onBack, onClose, onSuccess, onFailure }) => {
  const [activeTab, setActiveTab] = useState('gpay');
  const [stage, setStage] = useState('qr'); // qr | waiting | success | failed

  const provider = UPI_PROVIDERS.find(p => p.id === activeTab);

  const qrValues = {
    gpay: `upi://pay?pa=${UPI_PROVIDERS[0].upiId}&pn=LegalAI&am=${amount}&cu=INR&tn=Consultation+Fee&tr=GPY${Date.now()}&mode=02`,
    paytm: `upi://pay?pa=${UPI_PROVIDERS[1].upiId}&pn=LegalAI&am=${amount}&cu=INR&tn=Consultation+Fee&tr=PTM${Date.now()}&mode=02`,
    phonepe: `upi://pay?pa=${UPI_PROVIDERS[2].upiId}&pn=LegalAI&am=${amount}&cu=INR&tn=Consultation+Fee&tr=PPE${Date.now()}&mode=02`,
  };

  const handleComplete = () => {
    setStage('waiting');
    setTimeout(() => { setStage('success'); setTimeout(() => onSuccess(), 2000); }, 3500);
  };

  const handleTestFail = () => {
    setStage('waiting');
    setTimeout(() => setStage('failed'), 2500);
  };

  return (
    <div style={{ fontFamily:FONT }}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div style={{ padding:'22px 28px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ background:'#f1f5f9',border:'none',color:'#64748b',width:32,height:32,borderRadius:10,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#e2e8f0'; e.currentTarget.style.color='#334155'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#64748b'; }}
          >←</button>
          <h2 style={{ margin:0, fontSize:'1.15rem', fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em' }}>Secure Checkout</h2>
        </div>
        <button onClick={onClose} style={{ background:'none',border:'none',fontSize:'1.2rem',color:'#cbd5e1',cursor:'pointer',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#cbd5e1'; }}
        >✕</button>
      </div>

      {/* QR Stage */}
      {stage === 'qr' && (
        <div style={{ padding:'20px 28px 28px', animation:'pmFadeUp 0.3s ease-out' }}>
          {/* Amount */}
          <div style={{ textAlign:'center', marginBottom:22 }}>
            <p style={{ margin:'0 0 4px', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em' }}>Amount to pay</p>
            <h1 style={{ margin:0, fontSize:'2.4rem', fontWeight:900, color:'#0f172a', letterSpacing:'-0.03em' }}>₹{amount}</h1>
          </div>

          {/* Provider Tabs */}
          <div style={{ display:'flex', gap:0, marginBottom:22, background:'#f1f5f9', borderRadius:16, padding:4 }}>
            {UPI_PROVIDERS.map(p => {
              const active = activeTab === p.id;
              return (
                <button key={p.id} onClick={() => setActiveTab(p.id)} style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'12px 6px', borderRadius:13, border:'none',
                  background: active ? '#fff' : 'transparent',
                  boxShadow: active ? '0 2px 10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)' : 'none',
                  cursor:'pointer', transition:'all 0.3s cubic-bezier(.4,0,.2,1)',
                  transform: active ? 'scale(1)' : 'scale(0.97)',
                }}>
                  <ProviderLogo id={p.id} size={22} />
                  <span style={{ fontSize:'0.78rem', fontWeight:active?700:500, color:active?'#0f172a':'#94a3b8', transition:'all 0.2s' }}>{p.short}</span>
                </button>
              );
            })}
          </div>

          {/* QR Code */}
          <div key={activeTab} style={{ textAlign:'center', animation:'pmFadeUp 0.25s ease-out', marginBottom:18 }}>
            <div style={{
              display:'inline-block', padding:18, borderRadius:18,
              background:'#fff', border:`2px solid ${provider.color}20`,
              position:'relative', animation:'pmFloat 4s ease-in-out infinite',
            }}>
              {/* Colored corner markers */}
              {[
                { top:-2,left:-2, bTop:`3px solid ${provider.color}`, bLeft:`3px solid ${provider.color}`, br:'10px 0 0 0' },
                { top:-2,right:-2, bTop:`3px solid ${provider.color}`, bRight:`3px solid ${provider.color}`, br:'0 10px 0 0' },
                { bottom:-2,left:-2, bBottom:`3px solid ${provider.color}`, bLeft:`3px solid ${provider.color}`, br:'0 0 0 10px' },
                { bottom:-2,right:-2, bBottom:`3px solid ${provider.color}`, bRight:`3px solid ${provider.color}`, br:'0 0 10px 0' },
              ].map((c, i) => (
                <div key={i} style={{
                  position:'absolute', width:22, height:22,
                  top:c.top, right:c.right, bottom:c.bottom, left:c.left,
                  borderTop:c.bTop||'none', borderRight:c.bRight||'none',
                  borderBottom:c.bBottom||'none', borderLeft:c.bLeft||'none',
                  borderRadius:c.br,
                }} />
              ))}
              <QRCodeSVG value={qrValues[activeTab]} size={170} level="H" fgColor="#1e293b" bgColor="#fff" />
            </div>
          </div>

          {/* UPI ID Badge */}
          <div style={{ textAlign:'center', marginBottom:10 }}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'#f8fafc', borderRadius:24, padding:'8px 20px',
              border:'1px solid #e2e8f0',
            }}>
              <ProviderLogo id={activeTab} size={18} />
              <span style={{ fontSize:'0.8rem', color:'#64748b' }}>UPI ID: <strong style={{ color:'#1e293b', fontWeight:700 }}>{provider.upiId}</strong></span>
            </span>
          </div>

          {/* Instruction */}
          <p style={{ textAlign:'center', margin:'10px 0 22px', fontSize:'0.82rem', color:'#94a3b8' }}>
            Scan this QR using your <strong style={{ color:provider.color, fontWeight:600 }}>{provider.name}</strong> app
          </p>

          {/* Action Button */}
          <button onClick={handleComplete} style={{
            width:'100%', padding:16, borderRadius:14, border:'none',
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
            fontWeight:700, fontSize:'0.95rem', cursor:'pointer',
            boxShadow:'0 8px 24px rgba(99,102,241,0.35)',
            transition:'all 0.3s ease', letterSpacing:'0.01em',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(99,102,241,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(99,102,241,0.35)'; }}
          >
            I have completed payment
          </button>

          {/* Secondary actions */}
          <button onClick={handleTestFail} style={{ display:'block',width:'100%',marginTop:14,padding:6,background:'none',border:'none',color:'#cbd5e1',fontSize:'0.76rem',cursor:'pointer',transition:'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color='#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.color='#cbd5e1'}
          >Test Failure Scenario</button>
        </div>
      )}

      {/* Waiting */}
      {stage === 'waiting' && (
        <div style={{ padding:'56px 28px', textAlign:'center', animation:'pmFadeUp 0.3s ease-out' }}>
          <div style={{ position:'relative', width:64, height:64, margin:'0 auto 22px' }}>
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:'4px solid #eef2ff' }} />
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:'4px solid transparent',borderTopColor:'#6366f1',animation:'pmSpin 0.9s linear infinite' }} />
            <div style={{ position:'absolute',inset:10,borderRadius:'50%',background:'#f5f3ff',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <ProviderLogo id={activeTab} size={22} />
            </div>
          </div>
          <h3 style={{ margin:'0 0 6px', fontSize:'1.1rem', fontWeight:700, color:'#1e293b' }}>Verifying Payment</h3>
          <p style={{ margin:'0 0 18px', fontSize:'0.85rem', color:'#64748b' }}>Confirming with {provider.name}...</p>
          <div style={{ width:'50%',height:4,borderRadius:4,margin:'0 auto',background:'linear-gradient(90deg,#e2e8f0 25%,#c7d2fe 50%,#e2e8f0 75%)',backgroundSize:'200% 100%',animation:'pmShimmer 1.5s infinite' }} />
        </div>
      )}

      {/* Success */}
      {stage === 'success' && (
        <div style={{ padding:'48px 28px', textAlign:'center', animation:'pmFadeUp 0.4s ease-out' }}>
          <div style={{ width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#dcfce7,#bbf7d0)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',fontSize:'1.8rem',animation:'pmScalePop 0.5s ease-out',boxShadow:'0 8px 24px rgba(34,197,94,0.2)' }}>✓</div>
          <h3 style={{ margin:'0 0 4px', fontSize:'1.3rem', fontWeight:800, color:'#16a34a' }}>Payment Successful!</h3>
          <p style={{ margin:'0 0 18px', fontSize:'0.85rem', color:'#64748b' }}>₹{amount} paid via {provider.name}</p>
          <div style={{ background:'#f8fafc', borderRadius:12, padding:'12px 16px', border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem' }}>
              <span style={{ color:'#94a3b8' }}>UPI Ref</span>
              <span style={{ fontFamily:'monospace', color:'#0f172a', fontWeight:600, fontSize:'0.75rem' }}>TXN{Date.now().toString().slice(-10)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Failed */}
      {stage === 'failed' && (
        <div style={{ padding:'48px 28px', textAlign:'center', animation:'pmFadeUp 0.4s ease-out' }}>
          <div style={{ width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#fee2e2,#fecaca)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',fontSize:'1.8rem',animation:'pmScalePop 0.5s ease-out',boxShadow:'0 8px 24px rgba(239,68,68,0.15)' }}>✕</div>
          <h3 style={{ margin:'0 0 4px', fontSize:'1.3rem', fontWeight:800, color:'#dc2626' }}>Payment Failed</h3>
          <p style={{ margin:'0 0 24px', fontSize:'0.85rem', color:'#64748b' }}>Transaction could not be completed.</p>
          <button onClick={() => setStage('qr')} style={{ width:'100%',padding:14,borderRadius:12,border:'none',background:'#1e293b',color:'#fff',fontWeight:700,fontSize:'0.9rem',cursor:'pointer',marginBottom:8,transition:'all 0.2s' }}>Try Again</button>
          <button onClick={onClose} style={{ width:'100%',padding:10,background:'none',border:'none',color:'#94a3b8',fontSize:'0.85rem',cursor:'pointer' }}>Cancel</button>
        </div>
      )}
    </div>
  );
};


/* ============================================================
   MAIN PAYMENT MODAL
   ============================================================ */
const PaymentModal = ({ isOpen, onClose, paymentId, amount, onSuccess, onFailure, isAppointment = false }) => {
  const [method, setMethod] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) { setMethod(null); setClientSecret(''); setLoading(false); setError(''); return; }
    if (method !== 'stripe') return;
    setLoading(true); setError(''); setClientSecret('');
    api.post('/stripe/create-payment-intent', { amount, paymentId })
      .then(res => { if (res.data.client_secret) setClientSecret(res.data.client_secret); else setError('No client_secret received.'); })
      .catch(err => { console.error('Stripe intent error:', err); setError(err.response?.data?.error || 'Could not create payment intent.'); })
      .finally(() => setLoading(false));
  }, [isOpen, method, amount, paymentId]);

  if (!isOpen) return null;

  const resetAndClose = () => { setMethod(null); setClientSecret(''); setLoading(false); setError(''); onClose(); };

  /* ---- Payment Method Selector ---- */
  if (!method) {
    return (
      <div style={OVERLAY}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ ...MODAL, maxWidth:440, animation:'pmFadeUp 0.3s ease-out' }}>
          {/* Header */}
          <div style={{ padding:'28px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <h2 style={{ margin:'0 0 6px', fontSize:'1.25rem', fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em' }}>Payment Method</h2>
              <p style={{ margin:0, fontSize:'0.82rem', color:'#94a3b8' }}>Choose how to pay <strong style={{ color:'#475569' }}>₹{amount}</strong></p>
            </div>
            <button onClick={resetAndClose} style={{ background:'#f1f5f9',border:'none',color:'#94a3b8',width:32,height:32,borderRadius:10,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#94a3b8'; }}
            >✕</button>
          </div>

          {/* Options */}
          <div style={{ padding:'20px 28px 28px' }}>
            {/* UPI Option */}
            <button onClick={() => setMethod('upi')} style={{
              width:'100%', display:'flex', alignItems:'center', gap:16, padding:'16px 18px',
              borderRadius:16, border:'2px solid #e2e8f0', background:'#fff',
              cursor:'pointer', transition:'all 0.25s ease', marginBottom:12, textAlign:'left',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.background='#faf5ff'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(99,102,241,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#fff'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#f5f3ff,#eef2ff)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#6366f1' }}>
                <UPIIcon />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'0.92rem', color:'#0f172a' }}>UPI Payment</p>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <GPayLogo size={18} />
                  <PaytmLogo size={18} />
                  <PhonePeLogo size={18} />
                  <span style={{ fontSize:'0.72rem', color:'#94a3b8', marginLeft:2 }}>& more</span>
                </div>
              </div>
              <span style={{ color:'#cbd5e1', fontSize:'1.1rem' }}>›</span>
            </button>

            {/* Card Option */}
            <button onClick={() => setMethod('stripe')} style={{
              width:'100%', display:'flex', alignItems:'center', gap:16, padding:'16px 18px',
              borderRadius:16, border:'2px solid #e2e8f0', background:'#fff',
              cursor:'pointer', transition:'all 0.25s ease', textAlign:'left',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.background='#faf5ff'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(99,102,241,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='#fff'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#fff' }}>
                <CardIcon />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'0.92rem', color:'#0f172a' }}>Credit / Debit Card</p>
                <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}>Visa, Mastercard, Amex via Stripe</p>
              </div>
              <span style={{ color:'#cbd5e1', fontSize:'1.1rem' }}>›</span>
            </button>

            {/* Security footer */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20 }}>
              <ShieldIcon />
              <span style={{ fontSize:'0.7rem', color:'#cbd5e1', fontWeight:500 }}>All payments are secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- UPI Flow ---- */
  if (method === 'upi') {
    return (
      <div style={OVERLAY}>
        <div style={{ ...MODAL, maxWidth:460 }}>
          <UPIPaymentFlow amount={amount} onBack={() => setMethod(null)} onClose={resetAndClose} onSuccess={() => { onSuccess(); setMethod(null); }} onFailure={() => { onFailure(); setMethod(null); }} />
        </div>
      </div>
    );
  }

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div style={OVERLAY}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ ...MODAL, maxWidth:380, padding:48, textAlign:'center' }}>
          <div style={{ width:48,height:48,border:'4px solid #eef2ff',borderTop:'4px solid #6366f1',borderRadius:'50%',animation:'pmSpin 0.9s linear infinite',margin:'0 auto 20px' }}/>
          <p style={{ color:'#64748b',margin:0,fontWeight:600,fontSize:'0.9rem' }}>Connecting to Stripe...</p>
        </div>
      </div>
    );
  }

  /* ---- Error ---- */
  if (error) {
    return (
      <div style={OVERLAY}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ ...MODAL, maxWidth:400, padding:32, textAlign:'center' }}>
          <div style={{ width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#fee2e2,#fecaca)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'1.8rem',animation:'pmScalePop 0.5s ease-out' }}>✕</div>
          <h3 style={{ color:'#dc2626',margin:'0 0 8px',fontWeight:800,fontSize:'1.15rem' }}>Payment Error</h3>
          <p style={{ color:'#64748b',margin:'0 0 24px',fontSize:'0.85rem' }}>{error}</p>
          <button onClick={resetAndClose} style={{ padding:'12px 32px',background:'#1e293b',color:'#fff',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer',transition:'all 0.2s' }}>Close</button>
        </div>
      </div>
    );
  }

  /* ---- Stripe Card Flow ---- */
  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm amount={amount} clientSecret={clientSecret} onSuccess={onSuccess} onFailure={onFailure} onClose={resetAndClose} />
    </Elements>
  );
};

export default PaymentModal;
