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
  const [phone, setPhone] = useState("");
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
    
    // Validate email/username (allow both)
    const normalizedEmail = (forgotEmail || '').trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length < 3) {
      setOtpError('Please enter your email or username (at least 3 characters)');
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await publicFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ 
          username: normalizedEmail
        }),
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
        let errorMsg = data?.message || 'Failed to send OTP. Please verify your email and phone number are correct.';
        
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
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '').trim();
      const { ok, data } = await publicFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          username: normalizedPhone,
          otp: otp.join(''),
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      if (ok) {
        setOtpSuccess(data?.message || 'Password has been reset successfully');
        setTimeout(() => {
          setView("login");
          setPhone("");
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
        body: JSON.stringify({ 
          username: normalizedEmail
        }),
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

      <div style={{
        minHeight:"100vh", display:"flex",
        fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif",
        backgroundColor:"#000", overflow:"hidden",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300;1,400&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; }

          @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-18px) rotate(1.2deg)} }
          @keyframes floatB { 0%,100%{transform:translateY(0) rotate(2deg)}  50%{transform:translateY(-11px) rotate(-1.2deg)} }
          @keyframes floatC { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-13px) rotate(1.5deg)} }
          @keyframes orb    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(26px,-19px) scale(1.07)} 66%{transform:translate(-17px,13px) scale(0.94)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
          @keyframes spin   { to{transform:rotate(360deg)} }

          .gp  { animation:fadeUp .8s ease both; }
          .fr  { animation:fadeUp .8s ease both; }
          .fr:nth-child(1){animation-delay:.1s} .fr:nth-child(2){animation-delay:.2s}
          .fr:nth-child(3){animation-delay:.3s} .fr:nth-child(4){animation-delay:.4s}

          .ifield {
            width:100%; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1);
            border-radius:14px; padding:16px 18px; color:#fff; font-size:15px;
            font-family:inherit; outline:none; transition:all .3s; letter-spacing:.01em;
          }
          .ifield::placeholder { color:rgba(255,255,255,.25); }
          .ifield:focus {
            border-color:rgba(255,122,42,.62); background:rgba(255,255,255,.07);
            box-shadow:0 0 0 3px rgba(255,100,30,.09),inset 0 1px 0 rgba(255,255,255,.05);
          }
          .lbtn {
            width:100%; padding:16px; border:none; border-radius:14px; font-size:16px;
            font-weight:600; font-family:inherit; letter-spacing:.02em; cursor:pointer;
            background:linear-gradient(135deg,#ff8040 0%,#e05010 54%,#c03800 100%);
            color:#fff; transition:all .3s;
          }
          .lbtn:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 12px 42px rgba(255,100,30,.42); }
          .lbtn:active{ transform:translateY(0); }
          .lbtn:disabled{ opacity:.7; cursor:not-allowed; }
        `}</style>

        {/* ══ LEFT ══ */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between",
          padding:"40px 44px",
          background:"linear-gradient(145deg,#0a0500 0%,#130800 55%,#0d0500 100%)",
          position:"relative", overflow:"hidden",
        }}>
          {/* Orbs */}
          {[[{top:"12%",left:"4%"},{w:480,c:"rgba(255,112,42,.13)"}],
            [{bottom:"7%",right:"0%"},{w:340,c:"rgba(255,162,62,.09)"}],
            [{top:"48%",left:"37%"},{w:200,c:"rgba(255,82,22,.07)"}]
          ].map(([pos,{w,c}],i) => (
            <div key={i} style={{
              position:"absolute",...pos, width:w, height:w, borderRadius:"50%",
              background:`radial-gradient(circle,${c} 0%,transparent 70%)`,
              animation:`orb ${12+i*4}s ease-in-out infinite ${i*3}s`, pointerEvents:"none",
            }}/>
          ))}

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,color:"#fff",zIndex:1}}>
            <AppleLogo/>
            <span style={{fontSize:20,fontWeight:600,letterSpacing:"0.05em"}}>iPhone Center</span>
          </div>

          {/* Empty space */}
          <div style={{flex:1}}></div>

          {/* Tagline */}
          <div style={{zIndex:1}}>
            <p style={{
              color:"rgba(255,255,255,.3)", fontSize:13,
              fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", letterSpacing:"0.05em",
            }}>
              "Your Authorized iPhone Destination"
            </p>
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div style={{
          width:"44%", minWidth:420, background:"#000",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:"60px 52px", position:"relative",
        }}>
          <div style={{
            position:"absolute",top:0,left:0,right:0,height:200,
            background:"radial-gradient(ellipse at 50% 0%,rgba(255,100,30,.06) 0%,transparent 70%)",
            pointerEvents:"none",
          }}/>

          <div className="gp" style={{width:"100%",maxWidth:380}}>

            {/* ── LOGIN VIEW ── */}
            {view === "login" && <>
              <div style={{textAlign:"center",marginBottom:36}}>
                <div style={{
                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                  width:62,height:62,borderRadius:20,
                  background:"linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.03))",
                  border:"1px solid rgba(255,255,255,.12)", marginBottom:18, color:"#fff",
                }}>
                  <AppleLogo/>
                </div>
                <h1 style={{color:"#fff",fontSize:26,fontWeight:600,letterSpacing:"-0.02em",marginBottom:6}}>Staff Sign In</h1>
                <p style={{color:"rgba(255,255,255,.38)",fontSize:13}}>Enter your credentials to access the POS</p>
              </div>

              {error && (
                <div style={{
                  background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
                  borderRadius:12, padding:"12px 16px", marginBottom:20,
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(239,68,68,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.9)" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <span style={{color:"rgba(239,68,68,0.9)",fontSize:13,lineHeight:1.5}}>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div className="fr">
                  <label style={{display:"block",color:"rgba(255,255,255,.55)",fontSize:12,marginBottom:7,letterSpacing:"0.03em",textTransform:"uppercase"}}>Email Address</label>
                  <input className="ifield" type="email" placeholder="staff@iphonecenter.com"
                    value={email} onChange={e=>setEmail(e.target.value)} required/>
                </div>
                <div className="fr">
                  <label style={{display:"block",color:"rgba(255,255,255,.55)",fontSize:12,marginBottom:7,letterSpacing:"0.03em",textTransform:"uppercase"}}>Password</label>
                  <div style={{position:"relative"}}>
                    <input className="ifield" type={showPassword?"text":"password"}
                      placeholder="Enter your password" value={password}
                      onChange={e=>setPassword(e.target.value)} style={{paddingRight:50}} required/>
                    <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{
                      position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",
                      background:"none",border:"none",cursor:"pointer",
                      color:"rgba(255,255,255,.35)",padding:0,display:"flex",transition:"color .2s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.7)"}
                    onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.35)"}>
                      <EyeIcon open={showPassword}/>
                    </button>
                  </div>
                </div>

                <div className="fr" style={{textAlign:"right"}}>
                  <button type="button" onClick={()=>setView("forgot")} style={{
                    background:"none",border:"none",cursor:"pointer",
                    color:"rgba(255,120,40,.75)",fontSize:13,padding:0,transition:"color .2s",fontFamily:"inherit",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.color="#ff8040"}
                  onMouseLeave={e=>e.currentTarget.style.color="rgba(255,120,40,.75)"}>
                    Forgot password?
                  </button>
                </div>

                <div className="fr" style={{marginTop:4}}>
                  <button type="submit" className="lbtn" disabled={loading}>
                    {loading ? <div style={{width:20,height:20,border:"2px solid rgba(255,255,255,.25)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto"}}/> : "Sign In to POS"}
                  </button>
                </div>
              </form>
            </>}

            {/* ── FORGOT VIEW ── */}
            {view === "forgot" && <>
              <div style={{textAlign:"center",marginBottom:32}}>
                <div style={{
                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                  width:62,height:62,borderRadius:20,
                  background:"linear-gradient(135deg,rgba(255,120,40,.15),rgba(255,80,20,.06))",
                  border:"1px solid rgba(255,120,40,.25)", marginBottom:18,
                }}>
                  <Icon name="phone" size={26} color="#ff8040"/></div>
                <h1 style={{color:"#fff",fontSize:24,fontWeight:600,letterSpacing:"-0.02em",marginBottom:6}}>Forgot Password?</h1>
                <p style={{color:"rgba(255,255,255,.38)",fontSize:13,lineHeight:1.6}}>
                  Enter your registered email and phone number.<br/>We'll verify both match your account and send a 6-digit OTP.
                </p>
              </div>

              {otpError && (
                <div style={{
                  background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
                  borderRadius:12, padding:"12px 16px", marginBottom:20,
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{color:"rgba(239,68,68,0.9)",fontSize:13,lineHeight:1.5}}>{otpError}</span>
                </div>
              )}

              {otpSuccess && (
                <div style={{
                  background:"rgba(48,209,88,0.1)", border:"1px solid rgba(48,209,88,0.3)",
                  borderRadius:12, padding:"12px 16px", marginBottom:20,
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{color:"rgba(48,209,88,0.9)",fontSize:13,lineHeight:1.5}}>{otpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div className="fr">
                  <label style={{display:"block",color:"rgba(255,255,255,.55)",fontSize:12,marginBottom:7,letterSpacing:"0.03em",textTransform:"uppercase"}}>Email or Username</label>
                  <input className="ifield" type="text" placeholder="staff@iphonecenter.com"
                    value={forgotEmail} onChange={e=>{setForgotEmail(e.target.value);setOtpError("");}}
                    required/>
                </div>
                <div className="fr">
                  <label style={{display:"block",color:"rgba(255,255,255,.55)",fontSize:12,marginBottom:7,letterSpacing:"0.03em",textTransform:"uppercase"}}>Phone Number</label>
                  <div style={{position:"relative"}}>
                    <div style={{
                      position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",
                      color:"rgba(255,255,255,.4)",fontSize:14,fontWeight:600,
                      borderRight:"1px solid rgba(255,255,255,.1)",paddingRight:12,
                    }}>+94</div>
                    <input className="ifield" type="tel" placeholder="7X XXX XXXX"
                      value={phone} onChange={e=>{setPhone(e.target.value.replace(/\D/g,"").slice(0,9));setOtpError("");}}
                      style={{paddingLeft:62}} required/>
                  </div>
                </div>

                <div style={{marginTop:4,display:"flex",flexDirection:"column",gap:10}}>
                  <button type="submit" className="lbtn" disabled={loading || phone.length < 7 || !forgotEmail.trim()}>
                    {loading ? <div style={{width:20,height:20,border:"2px solid rgba(255,255,255,.25)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto"}}/> : "Send OTP"}
                  </button>
                  <button type="button" onClick={()=>{setView("login");setOtpError("");setOtpSuccess("");setPhone("");setForgotEmail("");}} style={{
                    background:"none",border:"1px solid rgba(255,255,255,.1)",borderRadius:14,
                    padding:"14px",color:"rgba(255,255,255,.45)",fontSize:14,cursor:"pointer",
                    fontFamily:"inherit",transition:"all .2s",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.25)";e.currentTarget.style.color="#fff"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.1)";e.currentTarget.style.color="rgba(255,255,255,.45)"}}>
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            </>}

            {/* ── OTP VIEW ── */}
            {view === "otp" && <>
              {/* Step indicator */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:28}}>
                {["Phone","OTP","Reset"].map((s,i) => (
                  <div key={s} style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{
                      width:24,height:24,borderRadius:"50%",fontSize:11,fontWeight:700,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      background:i<=1?"linear-gradient(135deg,#ff8040,#e05010)":"rgba(255,255,255,0.08)",
                      color:i<=1?"#fff":"rgba(255,255,255,0.3)",
                      border:i<=1?"none":"1px solid rgba(255,255,255,0.1)",
                    }}>{i+1}</div>
                    <span style={{fontSize:10,color:i<=1?"rgba(255,140,60,0.8)":"rgba(255,255,255,0.25)",fontWeight:i<=1?600:400}}>{s}</span>
                    {i<2 && <div style={{width:20,height:1,background:i<1?"rgba(255,120,40,0.4)":"rgba(255,255,255,0.1)"}}/>}
                  </div>
                ))}
              </div>

              <div style={{textAlign:"center",marginBottom:28}}>
                <div style={{
                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                  width:62,height:62,borderRadius:20,
                  background:"linear-gradient(135deg,rgba(255,120,40,.15),rgba(255,80,20,.06))",
                  border:"1px solid rgba(255,120,40,.25)", marginBottom:16,
                }}>
                  <Icon name="key" size={26} color="#ff8040"/></div>
                <h1 style={{color:"#fff",fontSize:22,fontWeight:600,letterSpacing:"-0.02em",marginBottom:6}}>Enter OTP Code</h1>
                <p style={{color:"rgba(255,255,255,.38)",fontSize:13,lineHeight:1.6}}>
                  6-digit code sent to<br/>
                  <span style={{color:"rgba(255,130,50,.9)",fontWeight:600,fontSize:14}}>
                    +94 {phone.slice(0,2)} {phone.slice(2,5)} {phone.slice(5)}
                  </span>
                </p>
              </div>

              {otpError && (
                <div style={{
                  background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
                  borderRadius:12, padding:"12px 16px", marginBottom:20,
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{color:"rgba(239,68,68,0.9)",fontSize:13,lineHeight:1.5}}>{otpError}</span>
                </div>
              )}

              {otpSuccess && (
                <div style={{
                  background:"rgba(48,209,88,0.1)", border:"1px solid rgba(48,209,88,0.3)",
                  borderRadius:12, padding:"12px 16px", marginBottom:20,
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{color:"rgba(48,209,88,0.9)",fontSize:13,lineHeight:1.5}}>{otpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{display:"flex",flexDirection:"column",gap:20}}>
                {/* OTP boxes */}
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  {otp.map((d,i) => (
                    <input key={i} id={`otp-${i}`}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e=>handleOtpChange(e.target.value,i)}
                      onKeyDown={e=>handleOtpKey(e,i)}
                      style={{
                        width:48,height:58,textAlign:"center",fontSize:24,fontWeight:700,
                        background:d?"rgba(255,120,40,.13)":"rgba(255,255,255,.04)",
                        border:d?"1.5px solid rgba(255,120,40,.6)":"1.5px solid rgba(255,255,255,.1)",
                        borderRadius:14,color:"#fff",outline:"none",
                        fontFamily:"inherit",transition:"all .2s",caretColor:"#ff8040",
                        boxShadow:d?"0 0 0 3px rgba(255,100,30,.08)":"none",
                      }}
                      onFocus={e=>{e.target.style.borderColor="rgba(255,120,40,.7)";e.target.style.boxShadow="0 0 0 3px rgba(255,100,30,.12)"}}
                      onBlur={e=>{if(!d){e.target.style.borderColor="rgba(255,255,255,.1)";e.target.style.boxShadow="none"}}}
                    />
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{background:"rgba(255,255,255,.06)",borderRadius:4,height:4,overflow:"hidden"}}>
                  <div style={{
                    height:"100%",borderRadius:4,transition:"width .3s ease",
                    width:`${(otp.filter(d=>d).length/6)*100}%`,
                    background:"linear-gradient(90deg,#ff8040,#ffb347)",
                  }}/>
                </div>

                {/* Resend */}
                <div style={{textAlign:"center"}}>
                  {countdown > 0 ? (
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <div style={{
                        width:28,height:28,borderRadius:"50%",
                        background:"rgba(255,120,40,.08)",border:"1px solid rgba(255,120,40,.2)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:11,fontWeight:700,color:"#ff8040",
                      }}>{countdown}</div>
                      <span style={{color:"rgba(255,255,255,.3)",fontSize:13}}>Resend OTP in <span style={{color:"#ff8040",fontWeight:600}}>{countdown}s</span></span>
                    </div>
                  ) : (
                    <button type="button" onClick={handleResendOtp} style={{
                      background:"none",border:"none",cursor:"pointer",
                      color:"rgba(255,120,40,.85)",fontSize:13,fontFamily:"inherit",padding:0,
                      textDecoration:"underline",textUnderlineOffset:3,
                    }}>
                      Resend OTP
                    </button>
                  )}
                </div>

                <button type="submit" className="lbtn" disabled={loading || !otpFilled}>
                  {loading
                    ? <div style={{width:20,height:20,border:"2px solid rgba(255,255,255,.25)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto"}}/>
                    : <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <Icon name="check" size={16} color="#fff"/> Verify OTP
                      </span>
                  }
                </button>

                <button type="button" onClick={()=>{setView("forgot");setOtp(["","","","","",""]);setOtpError("");setOtpSuccess("");}} style={{
                  background:"none",border:"none",cursor:"pointer",
                  color:"rgba(255,255,255,.3)",fontSize:13,fontFamily:"inherit",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:4,
                }}>
                  ← Change email or phone number
                </button>
              </form>
            </>}

            {/* ── RESET VIEW ── */}
            {view === "reset" && <>
              {/* Step indicator */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:28}}>
                {["Phone","OTP","Reset"].map((s,i) => (
                  <div key={s} style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{
                      width:24,height:24,borderRadius:"50%",fontSize:11,fontWeight:700,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      background:"linear-gradient(135deg,#ff8040,#e05010)",color:"#fff",
                    }}>{i+1}</div>
                    <span style={{fontSize:10,color:"rgba(255,140,60,0.8)",fontWeight:600}}>{s}</span>
                    {i<2 && <div style={{width:20,height:1,background:"rgba(255,120,40,0.4)"}}/>}
                  </div>
                ))}
              </div>
              <div style={{textAlign:"center",marginBottom:32}}>
                <div style={{
                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                  width:62,height:62,borderRadius:20,
                  background:"linear-gradient(135deg,rgba(48,209,88,.15),rgba(30,160,60,.06))",
                  border:"1px solid rgba(48,209,88,.3)", marginBottom:18,
                }}>
                  <Icon name="check" size={26} color="#30d158"/></div>
                <h1 style={{color:"#fff",fontSize:24,fontWeight:600,letterSpacing:"-0.02em",marginBottom:6}}>Set New Password</h1>
                <p style={{color:"rgba(255,255,255,.38)",fontSize:13}}>OTP verified. Create your new password.</p>
              </div>

              {otpError && (
                <div style={{
                  background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
                  borderRadius:12, padding:"12px 16px", marginBottom:20,
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{color:"rgba(239,68,68,0.9)",fontSize:13,lineHeight:1.5}}>{otpError}</span>
                </div>
              )}

              {otpSuccess && (
                <div style={{
                  background:"rgba(48,209,88,0.1)", border:"1px solid rgba(48,209,88,0.3)",
                  borderRadius:12, padding:"12px 16px", marginBottom:20,
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{color:"rgba(48,209,88,0.9)",fontSize:13,lineHeight:1.5}}>{otpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleReset} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div className="fr">
                  <label style={{display:"block",color:"rgba(255,255,255,.55)",fontSize:12,marginBottom:7,letterSpacing:"0.03em",textTransform:"uppercase"}}>New Password</label>
                  <div style={{position:"relative"}}>
                    <input className="ifield" type={showNew?"text":"password"}
                      placeholder="Min. 6 characters" value={newPassword}
                      onChange={e=>setNewPassword(e.target.value)} style={{paddingRight:50}} required minLength={6}/>
                    <button type="button" onClick={()=>setShowNew(!showNew)} style={{
                      position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",
                      background:"none",border:"none",cursor:"pointer",
                      color:"rgba(255,255,255,.35)",padding:0,display:"flex",
                    }}>
                      <EyeIcon open={showNew}/>
                    </button>
                  </div>
                </div>

                <div className="fr">
                  <label style={{display:"block",color:"rgba(255,255,255,.55)",fontSize:12,marginBottom:7,letterSpacing:"0.03em",textTransform:"uppercase"}}>Confirm Password</label>
                  <input className="ifield" type="password"
                    placeholder="Confirm your password" value={confirmPassword}
                    onChange={e=>setConfirmPassword(e.target.value)} required minLength={6}/>
                </div>

                {/* Password strength */}
                {newPassword.length > 0 && (
                  <div style={{display:"flex",gap:4}}>
                    {[4,6,8,10].map((min,i) => (
                      <div key={i} style={{
                        flex:1,height:4,borderRadius:2,
                        background:newPassword.length>=min
                          ?["#ff4444","#ff8040","#ffb347","#30d158"][i]
                          :"rgba(255,255,255,.1)",
                        transition:"background .3s",
                      }}/>
                    ))}
                    <span style={{
                      color:["#ff4444","#ff8040","#ffb347","#30d158"][
                        newPassword.length>=10?3:newPassword.length>=8?2:newPassword.length>=6?1:0
                      ],
                      fontSize:11,whiteSpace:"nowrap",alignSelf:"center",marginLeft:6,
                    }}>
                      {["Weak","Fair","Good","Strong"][newPassword.length>=10?3:newPassword.length>=8?2:newPassword.length>=6?1:0]}
                    </span>
                  </div>
                )}

                <div style={{marginTop:4}}>
                  <button type="submit" className="lbtn" disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}>
                    {loading ? <div style={{width:20,height:20,border:"2px solid rgba(255,255,255,.25)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto"}}/> : "Reset Password"}
                  </button>
                </div>
              </form>
            </>}

          </div>

          {/* Footer */}
          <div style={{
            position:"absolute",bottom:28,
            display:"flex",flexDirection:"column",alignItems:"center",gap:4,
          }}>
            <span style={{color:"rgba(255,255,255,.35)",fontSize:13,letterSpacing:"0.04em"}}>
              Powered by <span style={{color:"rgba(255,120,40,.86)",fontWeight:700}}>LogozoDev</span>
            </span>
            <span style={{color:"rgba(255,255,255,.3)",fontSize:12,letterSpacing:"0.1em"}}>v1.0.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
