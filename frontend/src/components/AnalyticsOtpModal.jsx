import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { authFetch } from '@/lib/api';

const initialDigits = ['', '', '', '', '', ''];

const AnalyticsOtpModal = ({ open, onClose, onVerified }) => {
  const [step, setStep] = useState('idle'); // idle | sending | otpSent | verifying | success | error
  const [digits, setDigits] = useState(initialDigits);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep('idle');
      setDigits(initialDigits);
      setError('');
      setInfo('');
      setResendCountdown(0);
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

  const handleVerify = async () => {
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
    setStep('success');
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
                For security, Analytics requires a one-time passcode sent to your registered admin phone.
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

          {/* Step 1: send OTP */}
          {step === 'idle' || step === 'sending' ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={step === 'sending'}
              className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:brightness-105 disabled:opacity-60"
            >
              {step === 'sending' ? 'Sending...' : 'Send OTP'}
            </button>
          ) : null}

          {/* Step 2: enter OTP */}
          {(step === 'otpSent' || step === 'verifying' || step === 'error') && (
            <div className="space-y-3 mt-2">
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
                onClick={handleVerify}
                disabled={step === 'verifying'}
                className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:brightness-105 disabled:opacity-60"
              >
                {step === 'verifying' ? 'Verifying...' : 'Verify & Continue'}
              </button>
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

