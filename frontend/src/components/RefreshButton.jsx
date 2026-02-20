import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Refresh button: dark rounded background (#1A1B23), white icon.
 * Shown top-right on every page except dashboard. Click reloads the current page.
 */
const RefreshButton = () => {
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    setSpinning(true);
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Refresh page"
      className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1B23] text-white transition-all hover:bg-[#222531] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <RefreshCw className={`h-5 w-5 ${spinning ? 'animate-spin' : ''}`} />
    </button>
  );
};

export default RefreshButton;
