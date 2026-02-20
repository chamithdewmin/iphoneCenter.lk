import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Global refresh button: dark background, white icon, rounded.
 * Shown on every page (via Layout). Click reloads the current page.
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
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-xl border border-[#2a2d3a] bg-[#1a1b2c] text-white shadow-lg transition-all hover:bg-[#22242f] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <RefreshCw className={`h-5 w-5 ${spinning ? 'animate-spin' : ''}`} />
    </button>
  );
};

export default RefreshButton;
