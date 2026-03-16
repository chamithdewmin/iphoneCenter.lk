import { useEffect, useState } from 'react';

/**
 * useAnalyticsGate
 *
 * Returns true ONLY when Analytics OTP has been verified and the 15‑minute window
 * is still active. Report pages should call this hook and avoid loading any data
 * until it returns true.
 */
export function useAnalyticsGate() {
  const [allowed, setAllowed] = useState(() => {
    try {
      const ts = typeof window !== 'undefined' ? window.analyticsAccessUntil : null;
      return typeof ts === 'number' && ts > Date.now();
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleGranted = (e) => {
      try {
        const ts = e?.detail;
        if (typeof ts === 'number' && ts > Date.now()) {
          setAllowed(true);
        }
      } catch {
        // ignore
      }
    };

    const handleExpired = () => {
      setAllowed(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('analytics-access-granted', handleGranted);
      window.addEventListener('analytics-access-expired', handleExpired);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('analytics-access-granted', handleGranted);
        window.removeEventListener('analytics-access-expired', handleExpired);
      }
    };
  }, []);

  // On mount, sanity‑check current global flag once
  useEffect(() => {
    try {
      const ts = typeof window !== 'undefined' ? window.analyticsAccessUntil : null;
      if (!ts || ts <= Date.now()) {
        setAllowed(false);
      }
    } catch {
      setAllowed(false);
    }
  }, []);

  return allowed;
}

