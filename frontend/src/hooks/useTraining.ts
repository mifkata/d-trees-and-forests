'use client';

import { useState, useCallback } from 'react';
import type { TrainRequest, TrainResult, TrainError } from '@/types/api';
import { trainModel } from '@/lib/api';

export interface UseTrainingReturn {
  isLoading: boolean;
  result: TrainResult | null;
  error: TrainError | null;
  train: (request: TrainRequest) => Promise<void>;
  setResult: (result: TrainResult | null) => void;
  clearResult: () => void;
  clearError: () => void;
}

export function useTraining(): UseTrainingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrainResult | null>(null);
  const [error, setError] = useState<TrainError | null>(null);

  const train = useCallback(async (request: TrainRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await trainModel(request);

      if (response.success) {
        setResult(response.data);
        setError(null);
      } else {
        setError(response.error);
        setResult(null);
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Network error',
        code: 'UNKNOWN_ERROR',
        details: String(err),
      });
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => setResult(null), []);
  const clearError = useCallback(() => setError(null), []);

  return {
    isLoading,
    result,
    error,
    train,
    setResult,
    clearResult,
    clearError,
  };
}
