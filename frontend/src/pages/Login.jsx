import { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/api";
import "./Login.css";

const AppleLogo = () => (
  <svg viewBox="0 0 814 1000" fill="currentColor" width="28" height="28">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.5 268.5-317.5 99.8 0 182.6 65.8 245.3 65.8 60.4 0 154.8-69.1 270-69.1zm-174.6-209.1c43.4-50.9 75.4-121.8 75.4-192.7 0-9.9-.9-19.9-2.6-28.4-71.8 2.6-156.4 48.4-207.3 107.4-39.5 44.3-81.5 119-81.5 191.8 0 10.9 1.9 21.8 2.6 25.3 4.5.6 11.9 1.6 19.1 1.6 64.4 0 142.8-43.3 194.3-105.5z" />
  </svg>
);

const EyeIcon = ({ open }) =>
  open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

const publicFetch = async (path, options = {}) => {
  const base = getApiUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { message: "Network error" } };
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [view, setView] = useState("login"); // "login" | "forgot" | "otp" | "reset"
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login((email || "").trim(), password);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid email or password. Please try again.");
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSuccess("");
    const normalizedEmail = (forgotEmail || "").trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length < 3) {
      setOtpError("Please enter your email (min 3 characters)");
      return;
    }
    setLoading(true);
    const { ok, data } = await publicFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail }),
    });
    setLoading(false);
    if (ok) {
      setOtpSuccess(data?.message || "OTP sent to your registered phone number.");
      setView("otp");
      setCountdown(60);
      const t = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(t);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      setOtpError(data?.message || "Failed to send OTP.");
    }
  };

  const handleOtpChange = (val, i) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setOtpError("");
  };

  const handleOtpKey = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      const prev = document.getElementById(`otp-${i - 1}`);
      prev?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp.every((d) => d !== "")) {
      setOtpError("Please enter the complete OTP code");
      return;
    }
    setView("reset");
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setOtpError("");
    const code = otp.join("");
    const normalizedEmail = (forgotEmail || "").trim().toLowerCase();

    if (newPassword.length < 6) {
      setOtpError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { ok, data } = await publicFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        username: normalizedEmail,
        otp: code,
        newPassword,
        confirmPassword,
      }),
    });
    setLoading(false);
    if (ok) {
      setOtpSuccess(data?.message || "Password reset successfully.");
      setView("login");
      setOtp(["", "", "", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      setForgotEmail("");
    } else {
      setOtpError(data?.message || "Failed to reset password.");
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setOtpSuccess("");
    const normalizedEmail = (forgotEmail || "").trim().toLowerCase();
    setLoading(true);
    const { ok, data } = await publicFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail }),
    });
    setLoading(false);
    if (ok) {
      setOtpSuccess("OTP resent successfully.");
      setCountdown(60);
    } else {
      setOtpError(data?.message || "Failed to resend OTP.");
    }
  };

  const otpFilled = otp.every((d) => d !== "");

  return (
    <>
      <Helmet>
        <title>Login - iphone center.lk</title>
      </Helmet>

      <div className="login-page">
        <div className="page">
          {/* LEFT HERO */}
          <section className="hero">
            <div className="hero-bg" />

            <nav className="nav a1">
              <a className="logo" href="#">
                <div className="logo-icon">
                  <AppleLogo />
                </div>
                <span className="logo-text vp-logo-text">
                  iPhone <span>Center</span>
                </span>
              </a>
              <div className="hotline">
                Support&nbsp;<strong>+1 800 275 2273</strong>
              </div>
            </nav>

            <div className="hero-inner">
              <p className="eyebrow a2">Premium Apple Experience</p>
              <h1 className="headline a3">
                Welcome to
                <br />
                <em>iPhone Center</em>
              </h1>
              <p className="tagline a4">
                Everything your phone shop needs — fast billing, smart inventory, and
                complete business control in one system.
              </p>
            </div>

            <footer className="hero-footer a1">
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Contact Us</a>
            </footer>
          </section>

          {/* RIGHT PANEL */}
          <section className="panel">
            {/* LOGIN */}
            {view === "login" && (
              <form className="panel-inner" onSubmit={handleLogin}>
                <p className="panel-eyebrow p1">Welcome Back</p>
                <h2 className="panel-title p2">
                  Sign In to
                  <br />
                  iPhone Center
                </h2>
                <p className="panel-sub p2">
                  Access your account and manage your devices.
                </p>

                {error && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      marginBottom: 12,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="form-group p3">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="form-group p4">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="forgot-link-row p4">
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => setView("forgot")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  className="submit-btn p5"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In \u2192"}
                </button>

                <p className="panel-bottom p6" style={{ marginTop: "18px" }}>
                  Powered by{" "}
                  <a
                    href="https://www.logozodev.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LogozoDev
                  </a>
                </p>
              </form>
            )}

            {/* FORGOT */}
            {view === "forgot" && (
              <form className="panel-inner" onSubmit={handleSendOtp}>
                <button
                  type="button"
                  className="back-btn p1"
                  onClick={() => {
                    setView("login");
                    setOtpError("");
                    setOtpSuccess("");
                    setForgotEmail("");
                  }}
                >
                  ← Back to Sign In
                </button>

                <p className="panel-eyebrow p1">Account Recovery</p>
                <h2 className="panel-title p2">
                  Forgot Your
                  <br />
                  Password?
                </h2>
                <p className="panel-sub p2">
                  No worries. Enter your registered email and we'll send you a secure
                  reset link instantly.
                </p>

                {otpError && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#b91c1c",
                    }}
                  >
                    {otpError}
                  </div>
                )}

                {otpSuccess && (
                  <div
                    style={{
                      background: "rgba(48,209,88,0.1)",
                      border: "1px solid rgba(48,209,88,0.3)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                    }}
                  >
                    {otpSuccess}
                  </div>
                )}

                <div className="form-group p3">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setOtpError("");
                    }}
                    placeholder="john@example.com"
                  />
                </div>

                <button
                  className="submit-btn p4"
                  type="submit"
                  disabled={loading || !forgotEmail.trim()}
                >
                  {loading ? "Sending..." : "Send Reset Link \u2192"}
                </button>

                <p className="note-text p5">
                  Remember your password?{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setView("login");
                    }}
                  >
                    Sign in here
                  </a>
                </p>
              </form>
            )}

            {/* OTP */}
            {view === "otp" && (
              <form
                className="panel-inner"
                onSubmit={handleVerifyOtp}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <h2 className="panel-title" style={{ marginBottom: 6 }}>
                  Enter OTP
                </h2>
                <p className="panel-sub" style={{ marginBottom: 12 }}>
                  We sent a 6-digit code to your email/phone.
                </p>

                {otpError && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#b91c1c",
                    }}
                  >
                    {otpError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKey(e, i)}
                      style={{
                        width: 40,
                        height: 48,
                        textAlign: "center",
                        fontSize: 22,
                        borderRadius: 10,
                        border: "1px solid #2a2a2a",
                        background: "#1a1a1a",
                        color: "#f0f0f0",
                      }}
                    />
                  ))}
                </div>

                <div style={{ textAlign: "center", fontSize: 13 }}>
                  {countdown > 0 ? (
                    <span>
                      Resend OTP in{" "}
                      <span style={{ color: "#f97316", fontWeight: 600 }}>{countdown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#bbbbbb",
                      }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  className="submit-btn p4"
                  type="submit"
                  disabled={loading || !otpFilled}
                >
                  {loading ? "Verifying..." : "Verify OTP \u2192"}
                </button>

                <button
                  type="button"
                  className="back-btn p5"
                  onClick={() => {
                    setView("forgot");
                    setOtp(["", "", "", "", "", ""]);
                    setOtpError("");
                    setOtpSuccess("");
                  }}
                >
                  ← Change email
                </button>
              </form>
            )}

            {/* RESET */}
            {view === "reset" && (
              <form
                className="panel-inner"
                onSubmit={handleReset}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <h2 className="panel-title" style={{ marginBottom: 6 }}>
                  Set new password
                </h2>
                <p className="panel-sub" style={{ marginBottom: 12 }}>
                  OTP verified. Create your new password.
                </p>

                {otpError && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#b91c1c",
                    }}
                  >
                    {otpError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">New password</label>
                  <input
                    className="form-input"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm password</label>
                  <input
                    className="form-input"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  className="submit-btn p4"
                  type="submit"
                  disabled={
                    loading ||
                    newPassword.length < 6 ||
                    newPassword !== confirmPassword
                  }
                >
                  {loading ? "Saving..." : "Reset password \u2192"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

