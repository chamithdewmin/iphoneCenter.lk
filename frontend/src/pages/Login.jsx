import { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

const AppleLogo = () => (
  <svg viewBox="0 0 814 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.5 268.5-317.5 99.8 0 182.6 65.8 245.3 65.8 60.4 0 154.8-69.1 270-69.1zm-174.6-209.1c43.4-50.9 75.4-121.8 75.4-192.7 0-9.9-.9-19.9-2.6-28.4-71.8 2.6-156.4 48.4-207.3 107.4-39.5 44.3-81.5 119-81.5 191.8 0 10.9 1.9 21.8 2.6 25.3 4.5.6 11.9 1.6 19.1 1.6 64.4 0 142.8-43.3 194.3-105.5z"/>
  </svg>
);

const EyeIcon = ({ open }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// New visual design styles (hero + panel) from VidProLogin
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .vp-root {
    display: flex; height: 100vh; width: 100vw;
    overflow: hidden; font-family: 'DM Sans', sans-serif;
  }

  .vp-hero {
    flex: 1 1 58%; position: relative; background: #080c18;
    overflow: hidden; display: flex; flex-direction: column;
    padding: 28px 36px 48px;
  }
  .vp-geo { position: absolute; pointer-events: none; }
  .vp-g1 { top:-100px;right:-80px;width:520px;height:520px;background:linear-gradient(145deg,#18243e 0%,#0d1628 55%,transparent 100%);clip-path:polygon(28% 0%,100% 0%,100% 68%,58% 100%,0% 58%);opacity:.95;animation:vpFadeIn 1s ease both; }
  .vp-g2 { top:60px;left:-60px;width:380px;height:360px;background:linear-gradient(125deg,#14213a 0%,transparent 75%);clip-path:polygon(0 0,100% 18%,82% 100%,0% 82%);opacity:.7;animation:vpFadeIn 1s .1s ease both; }
  .vp-g3 { bottom:-80px;right:20px;width:460px;height:400px;background:linear-gradient(205deg,#111c30 0%,#080c18 100%);clip-path:polygon(18% 0%,100% 28%,100% 100%,0% 100%);opacity:.9;animation:vpFadeIn 1s .2s ease both; }
  .vp-g4 { top:190px;right:60px;width:280px;height:300px;background:linear-gradient(175deg,#1c2f4e 0%,transparent 65%);clip-path:polygon(50% 0%,100% 48%,72% 100%,0% 78%,8% 18%);opacity:.45;animation:vpFadeIn 1s .3s ease both; }
  .vp-g5 { bottom:60px;left:20px;width:220px;height:220px;background:linear-gradient(140deg,#182540 0%,transparent 75%);clip-path:polygon(0 38%,62% 0%,100% 58%,42% 100%);opacity:.38;animation:vpFadeIn 1s .35s ease both; }
  .vp-g6 { top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:600px;background:radial-gradient(ellipse at center,rgba(79,142,247,.04) 0%,transparent 70%); }

  .vp-logo-text { font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem;color:#eef2ff;letter-spacing:.02em; }
  .vp-copy { position:relative;z-index:10;margin-top:auto; }
  .vp-headline { font-family:'DM Sans',sans-serif;font-weight:700;font-size:clamp(1.9rem,2.8vw,2.7rem);line-height:1.14;color:#eef2ff;letter-spacing:-.03em;margin-bottom:14px;animation:vpSlideUp .8s .2s ease both; }
  .vp-sub { font-size:.85rem;font-weight:300;color:rgba(220,230,255,.42);line-height:1.65;max-width:360px;animation:vpSlideUp .8s .35s ease both; }
  .vp-dots { display:flex;gap:6px;margin-top:24px;animation:vpSlideUp .8s .45s ease both; }
  .vp-dot { height:3px;border-radius:2px;background:rgba(255,255,255,.18);width:22px; }
  .vp-dot-active { background:#4f8ef7;width:36px; }

  .vp-panel { flex:0 0 520px;background:#fff;display:flex;align-items:center;justify-content:center;padding:32px 40px;overflow-y:auto; }
  .vp-card { width:100%;max-width:420px;animation:vpSlideUp .6s .1s ease both; }
  .vp-card-header { margin-bottom:26px; }
  .vp-title { font-family:'Syne',sans-serif;font-weight:700;font-size:1.7rem;color:#111827;letter-spacing:-.03em;margin-bottom:5px; }
  .vp-title-sub { font-size:.78rem;color:#9ca3af;font-weight:400; }

  .vp-form { display:flex;flex-direction:column;gap:14px; }
  .vp-field { display:flex;flex-direction:column;gap:5px; }
  .vp-label { font-size:.76rem;font-weight:500;color:#374151; }

  .vp-input { width:100%;height:42px;padding:0 14px;background:#f8f9fc;border:1.5px solid #e5e8f0;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:.84rem;color:#111827;outline:none;transition:border-color .2s,box-shadow .2s,background .2s; }
  .vp-input::placeholder { color:#c0c8d8; }
  .vp-input:focus { border-color:#4f8ef7;background:#fff;box-shadow:0 0 0 3px rgba(79,142,247,.1); }
  .vp-input-pr { padding-right:42px; }
  .vp-input-wrap { position:relative; }
  .vp-eye { position:absolute;right:11px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#b0bac8;display:flex;align-items:center;padding:3px;transition:color .2s; }
  .vp-eye:hover { color:#4f8ef7; }

  .vp-row { display:flex;align-items:center;justify-content:space-between;margin-top:-2px; }
  .vp-forgot { font-size:.76rem;color:#4f8ef7;font-weight:500;text-decoration:none;cursor:pointer;background:none;border:none;transition:color .2s; }
  .vp-forgot:hover { color:#3472e0; }

  .vp-btn-login { width:100%;height:43px;background:#111827;color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;letter-spacing:.02em;margin-top:4px;transition:background .2s,transform .12s,box-shadow .2s; }
  .vp-btn-login:hover:not(:disabled) { background:#1e2d42;transform:translateY(-1px);box-shadow:0 4px 14px rgba(17,24,39,.25); }
  .vp-btn-login:active:not(:disabled) { transform:translateY(0);box-shadow:none; }
  .vp-btn-login:disabled { opacity:.65;cursor:not-allowed; }

  .vp-spinner { width:17px;height:17px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:vpSpin .65s linear infinite; }

  @keyframes vpFadeIn { from{opacity:0}to{opacity:1} }
  @keyframes vpSlideUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
  @keyframes vpSpin { to{transform:rotate(360deg)} }

  @media (max-width:700px) { .vp-hero{display:none} .vp-panel{flex:1} }
`;

// ── SVG Icon Library ──
const Icon = ({ name, size=14, color="currentColor" }) => {
  const s = { width:size, height:size, display:"block", flexShrink:0 };
  const icons = {
    receipt: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>,
    box: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    users: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    chart: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    refresh: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>,
    shield: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    lock: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    phone: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    key: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    check: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    sync: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    printer: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    staff: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  };
  return icons[name] || null;
};

// Helper function for non-authenticated requests
const publicFetch = async (path, options = {}) => {
  const base = getApiUrl();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => ({}));
    
    // Log error responses for debugging
    if (!res.ok) {
      console.error('API Error Details:', JSON.stringify({
        url,
        status: res.status,
        data,
        errors: data?.errors,
        message: data?.message,
        body: options.body
      }, null, 2));
    }
    
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error('Public fetch error:', error);
    return { ok: false, status: 0, data: { message: 'Network error. Please check your connection.' } };
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password flow states
  const [view, setView] = useState("login"); // login | forgot | otp | reset
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login((email || "").trim(), password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid email or password. Please try again.');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSuccess("");
    
    const normalizedEmail = (forgotEmail || '').trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length < 3) {
      setOtpError('Please enter your email or username (at least 3 characters)');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await publicFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (ok) {
        setOtpSuccess(data?.message || 'OTP has been sent to your registered phone number');
        setOtpSent(true);
        setView("otp");
        setCountdown(60);
        const t = setInterval(() => {
          setCountdown(c => { if(c<=1){clearInterval(t);return 0;} return c-1; });
        }, 1000);
      } else {
        // Show validation errors if available, otherwise show general message
        let errorMsg = data?.message || 'Failed to send OTP. Please check your email and try again.';
        
        if (data?.errors && data.errors.length > 0) {
          const errorMessages = data.errors.map(e => e.message || e.msg || `${e.field}: ${e.message || e.msg}`).join('. ');
          errorMsg = errorMessages || errorMsg;
        }
        
        console.error('OTP Request Failed - Full Details:', JSON.stringify({
          status,
          message: errorMsg,
          errors: data?.errors,
          fullData: data,
          responseData: data
        }, null, 2));
        
        setOtpError(errorMsg);
      }
    } catch (err) {
      setOtpError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, i) => {
    if(!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val;
    setOtp(next);
    setOtpError("");
    if(val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
  };

  const handleOtpKey = (e, i) => {
    if(e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i-1}`)?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSuccess("");
    
    if (!otp.every(d => d !== "")) {
      setOtpError('Please enter the complete OTP code');
      return;
    }

    // Just verify OTP and move to reset view - don't reset password yet
    // The OTP will be verified again when resetting password
    setView("reset");
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setOtpError("");
    
    if (!otp.every(d => d !== "")) {
      setOtpError('Please enter the complete OTP code');
      return;
    }

    if (newPassword.length < 6) {
      setOtpError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setOtpError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = (forgotEmail || '').trim().toLowerCase();
      const { ok, data } = await publicFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          username: normalizedEmail,
          otp: otp.join(''),
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      if (ok) {
        setOtpSuccess(data?.message || 'Password has been reset successfully');
        setTimeout(() => {
          setView("login");
          setOtp(["","","","","",""]);
          setNewPassword("");
          setConfirmPassword("");
          setOtpSuccess("");
        }, 2000);
      } else {
        setOtpError(data?.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setOtpError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setOtpSuccess("");
    const normalizedEmail = (forgotEmail || '').trim().toLowerCase();
    
    setLoading(true);
    try {
      const { ok, data } = await publicFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (ok) {
        setOtpSuccess('OTP resent successfully');
        setCountdown(60);
        const t = setInterval(() => {
          setCountdown(c => { if(c<=1){clearInterval(t);return 0;} return c-1; });
        }, 1000);
      } else {
        setOtpError(data?.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setOtpError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const otpFilled = otp.every(d => d !== "");

  return (
    <>
      <Helmet>
        <title>Login - iphone center.lk</title>
        <meta name="description" content="Login to iphone center.lk POS system" />
      </Helmet>

      <style>{styles}</style>

      <div className="vp-root">
        {/* LEFT HERO (from VidProLogin, with iPhone Center text) */}
        <div className="vp-hero">
          <div className="vp-geo vp-g1"/><div className="vp-geo vp-g2"/>
          <div className="vp-geo vp-g3"/><div className="vp-geo vp-g4"/>
          <div className="vp-geo vp-g5"/><div className="vp-geo vp-g6"/>
          <div style={{display:'flex',justifyContent:'flex-start',alignItems:'center',width:'100%',position:'relative',zIndex:10}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <AppleLogo />
              <span className="vp-logo-text">iPhone Center</span>
            </div>
          </div>
          <div className="vp-copy">
            <h1 className="vp-headline">Sell Smarter.<br/>Manage Faster.<br/>Grow Your Phone Shop.</h1>
            <p className="vp-sub">
              From instant billing to inventory tracking and IMEI control, our smart POS system
              helps mobile shops run faster, reduce errors, and boost profits.
            </p>
            <div className="vp-dots">
              <span className="vp-dot vp-dot-active"/><span className="vp-dot"/><span className="vp-dot"/>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL – reusing existing logic, new card styling */}
        <div className="vp-panel">
          <div className="vp-card">
            {/* LOGIN VIEW (styled like VidProLogin) */}
            {view === "login" && (
              <>
                <div className="vp-card-header" style={{display:"flex",flexDirection:"column",gap:8}}>
                  <AppleLogo />
                  <div style={{marginTop:14}}>
                    <h2 className="vp-title">Welcome Back!</h2>
                    <p className="vp-title-sub">Log in to access your POS dashboard.</p>
                  </div>
                </div>

                {error && (
                  <div className="vp-alert vp-alert-err">
                    {error}
                  </div>
                )}

                <form className="vp-form" onSubmit={handleLogin}>
                  <div className="vp-field">
                    <label className="vp-label">Email or Username</label>
                    <input
                      type="email"
                      className="vp-input"
                      placeholder="staff@iphonecenter.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="vp-field">
                    <label className="vp-label">Password</label>
                    <div className="vp-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="vp-input vp-input-pr"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="vp-eye"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </div>
                  <div className="vp-row">
                    <span style={{fontSize:".76rem",color:"#9ca3af"}}>Staff access only</span>
                    <button
                      type="button"
                      className="vp-forgot"
                      onClick={() => setView("forgot")}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button type="submit" className="vp-btn-login" disabled={loading}>
                    {loading ? <span className="vp-spinner" /> : "Login"}
                  </button>
                </form>
              </>
            )}

            {/* EXISTING FORGOT / OTP / RESET VIEWS INSIDE SAME CARD */}
            {view === "forgot" && (
              <>
                <div className="vp-card-header">
                  <h2 className="vp-title">Forgot Password?</h2>
                  <p className="vp-title-sub">
                    Enter your registered email. We'll send a 6-digit OTP to your registered phone.
                  </p>
                </div>

                {otpError && (
                  <div className="vp-alert vp-alert-err">{otpError}</div>
                )}
                {otpSuccess && (
                  <div className="vp-alert vp-alert-ok">{otpSuccess}</div>
                )}

                <form className="vp-form" onSubmit={handleSendOtp}>
                  <div className="vp-field">
                    <label className="vp-label">Email</label>
                    <input
                      className="vp-input"
                      type="email"
                      placeholder="staff@iphonecenter.com"
                      value={forgotEmail}
                      onChange={e => { setForgotEmail(e.target.value); setOtpError(""); }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="vp-btn-login"
                    disabled={loading || !forgotEmail.trim()}
                  >
                    {loading ? <span className="vp-spinner" /> : "Send OTP"}
                  </button>
                  <button
                    type="button"
                    className="vp-back-btn"
                    onClick={() => { setView("login"); setOtpError(""); setOtpSuccess(""); setForgotEmail(""); }}
                  >
                    ← Back to Login
                  </button>
                </form>
              </>
            )}

            {view === "otp" && (
              <>
                <div className="vp-card-header">
                  <h2 className="vp-title">Enter OTP</h2>
                  <p className="vp-title-sub">
                    6-digit code sent to your registered phone.
                  </p>
                </div>

                {otpError && (
                  <div className="vp-alert vp-alert-err">{otpError}</div>
                )}
                {otpSuccess && (
                  <div className="vp-alert vp-alert-ok">{otpSuccess}</div>
                )}

                <form className="vp-form" onSubmit={handleVerifyOtp}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 4 }}>
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleOtpChange(e.target.value, i)}
                        onKeyDown={e => handleOtpKey(e, i)}
                        className="vp-otp-box"
                        style={{
                          borderColor: d ? "#4f8ef7" : "#e5e8f0",
                          background: d ? "#eef4ff" : "#f8f9fc"
                        }}
                      />
                    ))}
                  </div>
                  <div className="vp-resend">
                    {countdown > 0 ? (
                      <>Resend in <strong>{countdown}s</strong></>
                    ) : (
                      <>
                        <span>Didn't receive it? </span>
                        <button type="button" onClick={handleResendOtp}>Resend OTP</button>
                      </>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="vp-btn-login"
                    disabled={loading || !otpFilled}
                  >
                    {loading ? <span className="vp-spinner" /> : "Verify OTP"}
                  </button>
                  <button
                    type="button"
                    className="vp-back-btn"
                    onClick={() => { setView("forgot"); setOtp(["", "", "", "", "", ""]); setOtpError(""); setOtpSuccess(""); }}
                  >
                    ← Change email
                  </button>
                </form>
              </>
            )}

            {view === "reset" && (
              <>
                <div className="vp-card-header">
                  <h2 className="vp-title">Set New Password</h2>
                  <p className="vp-title-sub">
                    OTP verified. Create your new password.
                  </p>
                </div>

                {otpError && (
                  <div className="vp-alert vp-alert-err">{otpError}</div>
                )}
                {otpSuccess && (
                  <div className="vp-alert vp-alert-ok">{otpSuccess}</div>
                )}

                <form className="vp-form" onSubmit={handleReset}>
                  <div className="vp-field">
                    <label className="vp-label">New password</label>
                    <div className="vp-input-wrap">
                      <input
                        className="vp-input vp-input-pr"
                        type={showNew ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="vp-eye"
                        onClick={() => setShowNew(!showNew)}
                      >
                        <EyeIcon open={showNew} />
                      </button>
                    </div>
                  </div>
                  <div className="vp-field">
                    <label className="vp-label">Confirm password</label>
                    <input
                      className="vp-input"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  {newPassword.length > 0 && (
                    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
                      {[4, 6, 8, 10].map((min, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: newPassword.length >= min ? ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][i] : "#e5e7eb",
                            transition: "background .2s"
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="vp-btn-login"
                    disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                  >
                    {loading ? <span className="vp-spinner" /> : "Reset password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
