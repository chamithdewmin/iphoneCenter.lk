import React from 'react';

const styles = `
@keyframes dot-circle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(0.5); }
}
.dot { animation: dot-circle 1.2s ease-in-out infinite; }
.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }
.dot:nth-child(4) { animation-delay: 0.45s; }
.dot:nth-child(5) { animation-delay: 0.6s; }
.dot:nth-child(6) { animation-delay: 0.75s; }
.dot:nth-child(7) { animation-delay: 0.9s; }
.dot:nth-child(8) { animation-delay: 1.05s; }
`;

export default function Loading({ text = 'Loading...', fullScreen = false }) {
  const count = 8;
  const r = 28;
  const dotSize = 14;
  const containerSize = r * 2 + dotSize + 4;

  const containerClass = fullScreen 
    ? "min-h-screen bg-background flex items-center justify-center"
    : "flex items-center justify-center py-16";

  return (
    <div className={containerClass}>
      <style>{styles}</style>
      <div className="flex flex-col items-center gap-5">
        <div className="relative" style={{ width: containerSize, height: containerSize }}>
          {Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * 360;
            const rad = (angle * Math.PI) / 180;
            const cx = containerSize / 2 + Math.sin(rad) * r - dotSize / 2;
            const cy = containerSize / 2 - Math.cos(rad) * r - dotSize / 2;
            return (
              <span
                key={i}
                className="absolute rounded-full dot"
                style={{ 
                  left: cx, 
                  top: cy, 
                  width: dotSize, 
                  height: dotSize, 
                  backgroundColor: "#f97316" // Orange color
                }}
              />
            );
          })}
        </div>
        {text && <span className="text-muted-foreground text-base font-medium">{text}</span>}
      </div>
    </div>
  );
}
