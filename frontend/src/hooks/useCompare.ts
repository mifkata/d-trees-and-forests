'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DatasetId } from '@/types/dataset';
import type { TrainError } from '@/types/api';

export interface CompareSelection {
  tree: string | null;
  forest: string | null;
  gradient: string | null;
}

export interface CompareDatasetParams {
  mask: number;
  impute: boolean;
  ignore_columns: number[];
}

export interface HistoryRun {
  runId: string;
  model: string;
  dataset: string;
  accuracy: number;
  timestamp: number;
  name?: string;
}

export interface CompareModelResult {
  runId: string;
  trainAccuracy: number;
  compareAccuracy: number;
  imputed?: boolean;
}

export interface CompareResult {
  compareId: string;
  images: string[];
  modelColumns?: Record<string, number[]>;
  models: {
    tree: CompareModelResult | null;
    forest: CompareModelResult | null;
    gradient: CompareModelResult | null;
  };
}

interface UseCompareOptions {
  dataset: DatasetId;
  isCompareMode: boolean;
  isModelsTabActive: boolean;
}

interface UseCompareReturn {
  selection: CompareSelection;
  setSelection: (selection: CompareSelection) => void;
  updateSelection: (key: keyof CompareSelection, value: string | null) => void;
  datasetParams: CompareDatasetParams;
  setDatasetParams: (params: Partial<CompareDatasetParams>) => void;
  resetDatasetParams: () => void;
  isComparing: boolean;
  compareResult: CompareResult | null;
  compareError: TrainError | null;
  runCompare: () => Promise<void>;
  clearCompareResult: () => void;
  isSelectionComplete: boolean;
  historyTree: HistoryRun[];
  historyForest: HistoryRun[];
  historyGradient: HistoryRun[];
  isLoadingHistory: boolean;
}

const COMPARE_SELECTION_KEY = 'compare_selection';
const COMPARE_PARAMS_KEY = 'compare_params';

const DEFAULT_COMPARE_PARAMS: CompareDatasetParams = {
  mask: 0,
  impute: false,
  ignore_columns: [],
};

function getStoredSelection(dataset: DatasetId): CompareSelection {
  try {
    const stored = localStorage.getItem(`${COMPARE_SELECTION_KEY}_${dataset}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { tree: null, forest: null, gradient: null };
}

function storeSelection(dataset: DatasetId, selection: CompareSelection) {
  localStorage.setItem(`${COMPARE_SELECTION_KEY}_${dataset}`, JSON.stringify(selection));
}

function getStoredParams(dataset: DatasetId): CompareDatasetParams {
  try {
    const stored = localStorage.getItem(`${COMPARE_PARAMS_KEY}_${dataset}`);
    if (stored) {
      return { ...DEFAULT_COMPARE_PARAMS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_COMPARE_PARAMS };
}

function storeParams(dataset: DatasetId, params: CompareDatasetParams) {
  localStorage.setItem(`${COMPARE_PARAMS_KEY}_${dataset}`, JSON.stringify(params));
}

export function useCompare(options: UseCompareOptions): UseCompareReturn {
  const { dataset, isCompareMode, isModelsTabActive } = options;

  const [selection, setSelectionState] = useState<CompareSelection>({
    tree: null,
    forest: null,
    gradient: null,
  });
  const [datasetParams, setDatasetParamsState] = useState<CompareDatasetParams>(DEFAULT_COMPARE_PARAMS);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareError, setCompareError] = useState<TrainError | null>(null);

  const [historyTree, setHistoryTree] = useState<HistoryRun[]>([]);
  const [historyForest, setHistoryForest] = useState<HistoryRun[]>([]);
  const [historyGradient, setHistoryGradient] = useState<HistoryRun[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load stored selection and params when dataset changes
  useEffect(() => {
    const stored = getStoredSelection(dataset);
    setSelectionState(stored);
    const storedParams = getStoredParams(dataset);
    setDatasetParamsState(storedParams);
  }, [dataset]);

  // Fetch history when Compare mode Models tab becomes active
  useEffect(() => {
    if (!isCompareMode || !isModelsTabActive) return;

    async function fetchHistory() {
      setIsLoadingHistory(true);
      try {
        const [treeRes, forestRes, gradientRes] = await Promise.all([
          fetch(`/api/history?model=tree&dataset=${dataset}`),
          fetch(`/api/history?model=forest&dataset=${dataset}`),
          fetch(`/api/history?model=gradient&dataset=${dataset}`),
        ]);

        const [treeData, forestData, gradientData] = await Promise.all([
          treeRes.json(),
          forestRes.json(),
          gradientRes.json(),
        ]);

        setHistoryTree(treeData.runs || []);
        setHistoryForest(forestData.runs || []);
        setHistoryGradient(gradientData.runs || []);
      } catch {
        setHistoryTree([]);
        setHistoryForest([]);
        setHistoryGradient([]);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [dataset, isCompareMode, isModelsTabActive]);

  const setSelection = useCallback((newSelection: CompareSelection) => {
    setSelectionState(newSelection);
    storeSelection(dataset, newSelection);
  }, [dataset]);

  const updateSelection = useCallback((key: keyof CompareSelection, value: string | null) => {
    setSelectionState((prev) => {
      const newSelection = { ...prev, [key]: value };
      storeSelection(dataset, newSelection);
      return newSelection;
    });
  }, [dataset]);

  const setDatasetParams = useCallback((params: Partial<CompareDatasetParams>) => {
    setDatasetParamsState((prev) => {
      const newParams = { ...prev, ...params };
      storeParams(dataset, newParams);
      return newParams;
    });
  }, [dataset]);

  const resetDatasetParams = useCallback(() => {
    setDatasetParamsState(DEFAULT_COMPARE_PARAMS);
    storeParams(dataset, DEFAULT_COMPARE_PARAMS);
  }, [dataset]);

  const isSelectionComplete = Boolean(
    selection.tree && selection.forest && selection.gradient
  );

  const runCompare = useCallback(async () => {
    if (!isSelectionComplete) return;

    setIsComparing(true);
    setCompareError(null);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset,
          tree: selection.tree,
          forest: selection.forest,
          gradient: selection.gradient,
          mask: datasetParams.mask,
          impute: datasetParams.mask > 0 && datasetParams.impute,
          // ignore_columns not sent - determined from model's runtime.json
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setCompareError(data.error || {
          message: 'Compare failed',
          code: 'UNKNOWN_ERROR',
        });
        setCompareResult(null);
        return;
      }

      setCompareResult(data.data);
    } catch (err) {
      setCompareError({
        message: err instanceof Error ? err.message : 'Compare failed',
        code: 'UNKNOWN_ERROR',
      });
      setCompareResult(null);
    } finally {
      setIsComparing(false);
    }
  }, [dataset, selection, datasetParams, isSelectionComplete]);

  const clearCompareResult = useCallback(() => {
    setCompareResult(null);
    setCompareError(null);
  }, []);

  return {
    selection,
    setSelection,
    updateSelection,
    datasetParams,
    setDatasetParams,
    resetDatasetParams,
    isComparing,
    compareResult,
    compareError,
    runCompare,
    clearCompareResult,
    isSelectionComplete,
    historyTree,
    historyForest,
    historyGradient,
    isLoadingHistory,
  };
}
