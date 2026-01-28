'use client';

import { useState } from 'react';
import { Card } from './ui';
import type { TrainError } from '@/types/api';

interface ErrorDisplayProps {
  error: TrainError;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-red-800">Training Failed</h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <p className="text-sm text-red-700 mt-1">{error.message}</p>

          {(error.details || error.stackTrace) && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 text-xs text-red-600 hover:underline"
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>

              {showDetails && (
                <pre className="mt-3 p-3 rounded bg-red-100 text-red-800 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
                  {error.stackTrace || error.details}
                </pre>
              )}
            </>
          )}

          <p className="mt-2 text-xs text-red-600">Error code: {error.code}</p>
        </div>
      </div>
    </Card>
  );
}
