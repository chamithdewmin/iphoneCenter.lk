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

      <div style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
        overflow: "hidden",
      }}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          .login-fade { animation: fadeUp 0.5s ease both; }
          .login-field {
            width: 100%; background: #f8f9fa; border: 1px solid #e0e0e0;
            border-radius: 10px; padding: 14px 16px; color: #1a1a1a; font-size: 15px;
            font-family: inherit; outline: none; transition: border-color .2s, box-shadow .2s;
          }
          .login-field::placeholder { color: #888; }
          .login-field:focus {
            border-color: #A31F2A; box-shadow: 0 0 0 2px rgba(163,31,42,.15);
          }
          .login-btn {
            width: 100%; padding: 14px 24px; border: none; border-radius: 10px;
            font-size: 16px; font-weight: 600; font-family: inherit; cursor: pointer;
            background: #2563eb; color: #fff; transition: background .2s, transform .15s;
          }
          .login-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
          .login-btn:disabled { opacity: .7; cursor: not-allowed; }
        `}</style>

        {/* ══ LEFT — Light grey ══ */}
        <div style={{
          flex: "0 0 42%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 56px",
          background: "#F2F2F2",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <AppleLogo />
            <span style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", letterSpacing: "0.02em" }}>iPhone Center</span>
          </div>
          <h1 style={{
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 700,
            color: "#1a1a1a",
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
          }}>
            Welcome to iPhone Center POS
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, color: "#555", lineHeight: 1.6 }}>
            Sign in with your staff credentials to access inventory, sales, and reports.
          </p>
        </div>

        {/* ══ RIGHT — Dark red, white card with form ══ */}
        <div style={{
          flex: 1,
          minWidth: 0,
          background: "#A31F2A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          position: "relative",
        }}>
          <div className="login-fade" style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,.2)",
            padding: "40px 44px",
          }}>

            {/* ── LOGIN VIEW ── */}
            {view === "login" && <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h2 style={{ color: "#1a1a1a", fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Sign in</h2>
                <p style={{ color: "#666", fontSize: 14 }}>Enter your credentials to access the POS</p>
              </div>

              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 18,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ color: "#b91c1c", fontSize: 13, lineHeight: 1.5 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "#374151", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Email or username</label>
                  <input className="login-field" type="email" placeholder="staff@iphonecenter.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: "block", color: "#374151", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input className="login-field" type={showPassword ? "text" : "password"}
                      placeholder="Enter your password" value={password}
                      onChange={e => setPassword(e.target.value)} style={{ paddingRight: 48 }} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "#6b7280", padding: 0, display: "flex",
                    }}>
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <button type="button" onClick={() => setView("forgot")} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#A31F2A", fontSize: 13, padding: 0, fontFamily: "inherit",
                  }}>
                    Forgot password?
                  </button>
                </div>

                <div style={{ marginTop: 4 }}>
                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? <div style={{ width: 22, height: 22, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} /> : "Sign in"}
                  </button>
                </div>
              </form>
            </>}

            {/* ── FORGOT VIEW ── */}
            {view === "forgot" && <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h2 style={{ color: "#1a1a1a", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Forgot password?</h2>
                <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>
                  Enter your registered email. We'll send a 6-digit OTP to your registered phone.
                </p>
              </div>

              {otpError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
                  <span style={{ color: "#b91c1c", fontSize: 13 }}>{otpError}</span>
                </div>
              )}
              {otpSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
                  <span style={{ color: "#166534", fontSize: 13 }}>{otpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "#374151", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Email</label>
                  <input className="login-field" type="email" placeholder="staff@iphonecenter.com"
                    value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setOtpError(""); }} required />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button type="submit" className="login-btn" disabled={loading || !forgotEmail.trim()}>
                    {loading ? <div style={{ width: 22, height: 22, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} /> : "Send OTP"}
                  </button>
                  <button type="button" onClick={() => { setView("login"); setOtpError(""); setOtpSuccess(""); setForgotEmail(""); }} style={{
                    background: "none", border: "1px solid #d1d5db", borderRadius: 10, padding: 12, color: "#6b7280", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    ← Back to Sign in
                  </button>
                </div>
              </form>
            </>}

            {/* ── OTP VIEW ── */}
            {view === "otp" && <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                {["Email", "OTP", "Reset"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: i <= 1 ? "#2563eb" : "#e5e7eb", color: i <= 1 ? "#fff" : "#6b7280",
                    }}>{i + 1}</div>
                    <span style={{ fontSize: 11, color: i <= 1 ? "#374151" : "#9ca3af" }}>{s}</span>
                    {i < 2 && <div style={{ width: 16, height: 1, background: "#e5e7eb" }} />}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <h2 style={{ color: "#1a1a1a", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Enter OTP</h2>
                <p style={{ color: "#666", fontSize: 14 }}>6-digit code sent to your registered phone.</p>
              </div>
              {otpError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <span style={{ color: "#b91c1c", fontSize: 13 }}>{otpError}</span>
                </div>
              )}
              {otpSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <span style={{ color: "#166534", fontSize: 13 }}>{otpSuccess}</span>
                </div>
              )}
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {otp.map((d, i) => (
                    <input key={i} id={`otp-${i}`}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => handleOtpChange(e.target.value, i)}
                      onKeyDown={e => handleOtpKey(e, i)}
                      style={{
                        width: 44, height: 52, textAlign: "center", fontSize: 22, fontWeight: 700,
                        background: d ? "#eff6ff" : "#f8f9fa", border: d ? "2px solid #2563eb" : "1px solid #e0e0e0",
                        borderRadius: 10, color: "#1a1a1a", outline: "none", fontFamily: "inherit",
                      }}
                    />
                  ))}
                </div>
                <div style={{ textAlign: "center" }}>
                  {countdown > 0 ? (
                    <span style={{ color: "#6b7280", fontSize: 13 }}>Resend in <strong style={{ color: "#2563eb" }}>{countdown}s</strong></span>
                  ) : (
                    <button type="button" onClick={handleResendOtp} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontSize: 13, fontFamily: "inherit", textDecoration: "underline" }}>
                      Resend OTP
                    </button>
                  )}
                </div>
                <button type="submit" className="login-btn" disabled={loading || !otpFilled}>
                  {loading ? <div style={{ width: 22, height: 22, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} /> : "Verify OTP"}
                </button>
                <button type="button" onClick={() => { setView("forgot"); setOtp(["", "", "", "", "", ""]); setOtpError(""); setOtpSuccess(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 13, fontFamily: "inherit" }}>
                  ← Change email
                </button>
              </form>
            </>}

            {/* ── RESET VIEW ── */}
            {view === "reset" && <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                {["Email", "OTP", "Reset"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", background: "#2563eb", color: "#fff" }}>{i + 1}</div>
                    <span style={{ fontSize: 11, color: "#374151" }}>{s}</span>
                    {i < 2 && <div style={{ width: 16, height: 1, background: "#e5e7eb" }} />}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h2 style={{ color: "#1a1a1a", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Set new password</h2>
                <p style={{ color: "#666", fontSize: 14 }}>OTP verified. Create your new password.</p>
              </div>
              {otpError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <span style={{ color: "#b91c1c", fontSize: 13 }}>{otpError}</span>
                </div>
              )}
              {otpSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <span style={{ color: "#166534", fontSize: 13 }}>{otpSuccess}</span>
                </div>
              )}
              <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "#374151", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>New password</label>
                  <div style={{ position: "relative" }}>
                    <input className="login-field" type={showNew ? "text" : "password"} placeholder="Min. 6 characters" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} style={{ paddingRight: 48 }} required minLength={6} />
                    <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0, display: "flex" }}>
                      <EyeIcon open={showNew} />
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", color: "#374151", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Confirm password</label>
                  <input className="login-field" type="password" placeholder="Confirm your password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                </div>
                {newPassword.length > 0 && (
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[4, 6, 8, 10].map((min, i) => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: newPassword.length >= min ? ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][i] : "#e5e7eb", transition: "background .2s" }} />
                    ))}
                    <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
                      {["Weak", "Fair", "Good", "Strong"][newPassword.length >= 10 ? 3 : newPassword.length >= 8 ? 2 : newPassword.length >= 6 ? 1 : 0]}
                    </span>
                  </div>
                )}
                <div style={{ marginTop: 4 }}>
                  <button type="submit" className="login-btn" disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}>
                    {loading ? <div style={{ width: 22, height: 22, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} /> : "Reset password"}
                  </button>
                </div>
              </form>
            </>}
          </div>

          {/* Footer on red side */}
          <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center" }}>
            <span style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>Powered by <span style={{ fontWeight: 600, color: "#fff" }}>LogozoDev</span></span>
          </div>
        </div>
      </div>
    </>
  );
}
