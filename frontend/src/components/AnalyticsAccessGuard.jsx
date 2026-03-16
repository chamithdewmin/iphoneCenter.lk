import React from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAnalyticsGate } from '@/hooks/useAnalyticsGate';

const AnalyticsAccessGuard = ({ children }) => {
  const allowed = useAnalyticsGate();

  const handleRequestAccess = () => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('analytics-request-access'));
      }
    } catch {
      // ignore
    }
  };

  if (!allowed) {
    return (
      <div className="min-h-[360px] flex items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl bg-card border border-secondary shadow-lg px-8 py-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Analytics access denied
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These reports contain sensitive financial data. Verify with a one-time
              code to securely unlock <span className="font-semibold">all analytics reports</span>{' '}
              for the next 15 minutes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestAccess}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Get access
          </button>
          <p className="text-[11px] text-muted-foreground">
            Access automatically locks again after 15 minutes or when you log out.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AnalyticsAccessGuard;

