'use client';

import { useState } from 'react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      {children}
      <button
        type="button"
        className="ml-1 text-gray-400 hover:text-gray-600"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="Info"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      {isVisible && (
        <div className="absolute z-50 left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg max-w-xs whitespace-normal">
          {content}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </span>
  );
}

interface InfoIconProps {
  tooltip: string;
}

export function InfoIcon({ tooltip }: InfoIconProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="text-gray-400 hover:text-gray-600"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="Info"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      {isVisible && (
        <div className="absolute z-50 left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg w-48 whitespace-normal">
          {tooltip}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </span>
  );
}
