import React from 'react';

export function WindowIcon({ size = 40, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="square" 
      strokeLinejoin="miter"
      className={className}
    >
      {/* Marco exterior */}
      <rect x="4" y="4" width="16" height="18" />
      {/* Marco interior */}
      <rect x="5" y="5" width="14" height="16" />
      {/* División central */}
      <line x1="12" y1="5" x2="12" y2="21" />
    </svg>
  );
}