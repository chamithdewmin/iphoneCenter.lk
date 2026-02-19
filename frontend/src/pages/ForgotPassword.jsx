import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import loginBg from '@/assets/login-bg.jpg';
import Loading from '@/components/Loading';

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
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error('Public fetch error:', error);
    return { ok: false, status: 0, data: { message: 'Network error. Please check your connection.' } };
  }
};

const ForgotPassword = () => {
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!username.trim()) {
      setFieldErrors({ username: 'Username or email is required' });
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await publicFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim() }),
      });

      if (ok) {
        setSuccess(data?.message || 'OTP has been sent to your registered phone number');
        setStep('verify');
      } else {
        setError(data?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const errs = {};
    if (!otp.trim()) errs.otp = 'OTP is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    if (newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await publicFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      if (ok) {
        setSuccess(data?.message || 'Password has been reset successfully');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data?.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - iphone center.lk</title>
        <meta name="description" content="Reset your password for iphone center.lk" />
      </Helmet>

      <div
        className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <div className="absolute inset-0 bg-black/40 z-0" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="bg-[#2d2d2d] rounded-2xl shadow-2xl p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  <span className="text-primary">iphone</span>
                  <span className="text-white"> center.lk</span>
                </h1>
                <p className="text-white/90 text-lg">
                  {step === 'request' ? 'Forgot Password' : 'Reset Password'}
                </p>
              </div>

              {/* Success message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 flex items-center gap-2"
                  role="alert"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <span className="text-sm text-green-300">{success}</span>
                </motion.div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="text-sm text-red-300">{error}</span>
                </motion.div>
              )}

              {step === 'request' ? (
                <form onSubmit={handleRequestOTP} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white font-medium">
                      Email or Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder="Enter your email or username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setFieldErrors((p) => ({ ...p, username: undefined }));
                      }}
                      required
                      className={`bg-[#1a1a1a] border-[#404040] text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary/20 ${
                        fieldErrors.username ? 'border-red-500' : ''
                      }`}
                    />
                    {fieldErrors.username && (
                      <p className="text-sm text-red-400" role="alert">
                        {fieldErrors.username}
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-white/70">
                    Enter your email or username. We'll send an OTP to your registered phone number.
                  </p>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-medium py-2.5 rounded-lg focus:ring-primary/30 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-white font-medium">
                      OTP Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setFieldErrors((p) => ({ ...p, otp: undefined }));
                      }}
                      maxLength={6}
                      required
                      className={`bg-[#1a1a1a] border-[#404040] text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary/20 text-center text-2xl tracking-widest ${
                        fieldErrors.otp ? 'border-red-500' : ''
                      }`}
                    />
                    {fieldErrors.otp && (
                      <p className="text-sm text-red-400" role="alert">
                        {fieldErrors.otp}
                      </p>
                    )}
                    <p className="text-xs text-white/60">
                      Check your registered phone number for the OTP code
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white font-medium">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, newPassword: undefined }));
                      }}
                      required
                      className={`bg-[#1a1a1a] border-[#404040] text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary/20 ${
                        fieldErrors.newPassword ? 'border-red-500' : ''
                      }`}
                    />
                    {fieldErrors.newPassword && (
                      <p className="text-sm text-red-400" role="alert">
                        {fieldErrors.newPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white font-medium">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                      }}
                      required
                      className={`bg-[#1a1a1a] border-[#404040] text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary/20 ${
                        fieldErrors.confirmPassword ? 'border-red-500' : ''
                      }`}
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="text-sm text-red-400" role="alert">
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep('request');
                        setOtp('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setError('');
                        setSuccess('');
                        setFieldErrors({});
                      }}
                      className="flex-1 border-secondary text-white hover:bg-secondary"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground font-medium py-2.5 rounded-lg focus:ring-primary/30 transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Footer */}
              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
