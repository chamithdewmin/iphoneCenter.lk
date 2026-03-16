import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { authFetch } from '@/lib/api';

const initialDigits = ['', '', '', '', '', ''];

/**
 * SecurityVerificationModal
 * - Option 1: confirm password (recommended)
 * - Option 2: OTP to registered phone
 */
const AnalyticsOtpModal = ({ open, onClose, onVerified, phoneMasked = 'your registered phone' }) => {
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('idle'); // for OTP: idle | sending | otpSent | verifying | error
  const [digits, setDigits] = useState(initialDigits);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode('password');
      setPassword('');
      setStep('idle');
      setDigits(initialDigits);
      setError('');
      setInfo('');
      setResendCountdown(0);
      setLoading(false);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || resendCountdown <= 0) return;
    const t = setInterval(() => {
      setResendCountdown((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [open, resendCountdown]);

  const handleUnlockWithPassword = async () => {
    setError('');
    if (!password.trim()) {
      setError('Please enter your account password.');
      return;
    }
    setLoading(true);
    const { ok, data } = await authFetch('/api/analytics/password/unlock', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!ok || !data?.success) {
      setError(data?.message || 'Password verification failed.');
      return;
    }
    try {
      if (data.grantedUntil) {
        const ts = new Date(data.grantedUntil).getTime();
        window.analyticsAccessUntil = ts;
      }
    } catch {
      // ignore
    }
    onVerified?.(data?.grantedUntil || null);
    onClose();
  };

  const handleSendOtp = async () => {
    setError('');
    setInfo('');
    setStep('sending');
    const { ok, data } = await authFetch('/api/analytics/otp/send', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!ok) {
      setStep('error');
      setError(data?.message || 'Failed to send OTP.');
      return;
    }
    setStep('otpSent');
    setInfo(data?.message || 'OTP sent to your registered phone number.');
    setResendCountdown(Math.min(data?.expiresInSeconds || 300, 300));
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
  };

  const otpComplete = digits.every((d) => d !== '');

  const handleVerifyOtp = async () => {
    if (!otpComplete) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setStep('verifying');
    const otp = digits.join('');
    const { ok, data } = await authFetch('/api/analytics/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
    if (!ok || !data?.success) {
      setStep('error');
      setError(data?.message || 'Invalid or expired OTP. Please try again.');
      return;
    }
    try {
      if (data.grantedUntil) {
        const ts = new Date(data.grantedUntil).getTime();
        window.analyticsAccessUntil = ts;
      }
    } catch {
      // ignore
    }
    onVerified?.(data?.grantedUntil || null);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md rounded-2xl bg-card border border-secondary shadow-lg p-6 space-y-4"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
        >
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Verify access to Analytics</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Analytics contains sensitive financial data. Please verify your identity.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 text-xs font-medium">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg border ${
                mode === 'password'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-secondary text-muted-foreground'
              }`}
              onClick={() => setMode('password')}
            >
              Use Password
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg border ${
                mode === 'otp'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-secondary text-muted-foreground'
              }`}
              onClick={() => setMode('otp')}
            >
              Send OTP
            </button>
          </div>

          {mode === 'password' && (
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">Account password</label>
              <input
                type="password"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={handleUnlockWithPassword}
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify & Unlock'}
              </button>
            </div>
          )}

          {mode === 'otp' && (
            <div className="space-y-3 mt-2">
              <p className="text-xs text-muted-foreground">
                We will send a 6-digit code to <span className="font-semibold">{phoneMasked}</span>.
              </p>

              {(step === 'idle' || step === 'sending') && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={step === 'sending'}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:brightness-105 disabled:opacity-60"
                >
                  {step === 'sending' ? 'Sending...' : 'Send OTP'}
                </button>
              )}

              {(step === 'otpSent' || step === 'verifying' || step === 'error') && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Enter the 6-digit code we sent to your phone.
                    </span>
                    {resendCountdown > 0 ? (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Resend in {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[11px] text-primary hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between gap-1">
                    {digits.map((d, idx) => (
                      <input
                        key={idx}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-input bg-background text-center text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={step === 'verifying'}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:brightness-105 disabled:opacity-60"
                  >
                    {step === 'verifying' ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </>
              )}
            </div>
          )}

          {info && (
            <p className="text-xs text-emerald-400 mt-1">
              {info}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-400 mt-1">
              {error}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">
            Access to Analytics will stay unlocked for 15 minutes after successful verification.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnalyticsOtpModal;

