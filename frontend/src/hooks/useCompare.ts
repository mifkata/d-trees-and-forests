'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DatasetId } from '@/types/dataset';
import type { TrainError } from '@/types/api';

// Each entry in the models array for compare selection
export interface CompareModelEntry {
  id: string;       // Unique key for React (e.g., UUID or timestamp)
  modelType: 'tree' | 'forest' | 'gradient' | 'hist-gradient' | null;  // Selected model type
  runId: string | null;  // Selected run ID, null if not yet selected
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
  model: 'tree' | 'forest' | 'gradient' | 'hist-gradient';
  columns: number[];
  trainAccuracy: number;
  compareAccuracy: number;
  imputed?: boolean;
}

export interface CompareResult {
  compareId: string;
  images: string[];
  models: CompareModelResult[];
}

export interface CompareHistoryModelInfo {
  runId: string;
  model: string;
  name: string | null;
}

export interface CompareHistoryRun {
  compareId: string;
  dataset: string;
  timestamp: number;
  name: string | null;
  mask: number;
  impute: boolean;
  models: CompareHistoryModelInfo[];
}

interface UseCompareOptions {
  dataset: DatasetId;
  isCompareMode: boolean;
}

interface UseCompareReturn {
  models: CompareModelEntry[];
  removeModel: (id: string) => void;
  updateModelType: (id: string, modelType: CompareModelEntry['modelType']) => void;
  updateModelRun: (id: string, runId: string | null) => void;
  duplicateRunIds: Set<string>;
  datasetParams: CompareDatasetParams;
  setDatasetParams: (params: Partial<CompareDatasetParams>) => void;
  resetDatasetParams: () => void;
  isComparing: boolean;
  compareResult: CompareResult | null;
  compareError: TrainError | null;
  runCompare: () => Promise<void>;
  clearCompareResult: () => void;
  canCompare: boolean;
  history: HistoryRun[];
  isLoadingHistory: boolean;
  // Compare history
  compareHistory: CompareHistoryRun[];
  isLoadingCompareHistory: boolean;
  fetchCompareHistory: () => Promise<void>;
  deleteCompareRun: (compareId: string) => Promise<boolean>;
  renameCompareRun: (compareId: string, name: string | null) => Promise<boolean>;
  setCompareResult: (result: CompareResult | null) => void;
  loadModelsFromResult: (result: CompareResult) => void;
}

const COMPARE_MODELS_KEY = 'compare_models';
const COMPARE_PARAMS_KEY = 'compare_params';

const DEFAULT_COMPARE_PARAMS: CompareDatasetParams = {
  mask: 0,
  impute: false,
  ignore_columns: [],
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyModel(): CompareModelEntry {
  return { id: generateId(), modelType: null, runId: null };
}

function ensureEmptyModel(models: CompareModelEntry[]): CompareModelEntry[] {
  // Ensure there's exactly one empty model at the end
  const hasEmpty = models.some((m) => m.runId === null);
  if (!hasEmpty) {
    return [...models, createEmptyModel()];
  }
  return models;
}

function getStoredModels(dataset: DatasetId): CompareModelEntry[] {
  try {
    const stored = localStorage.getItem(`${COMPARE_MODELS_KEY}_${dataset}`);
    if (stored) {
      const models = JSON.parse(stored) as CompareModelEntry[];
      return ensureEmptyModel(models);
    }
  } catch {
    // ignore
  }
  return [createEmptyModel()];
}

function storeModels(dataset: DatasetId, models: CompareModelEntry[]) {
  localStorage.setItem(`${COMPARE_MODELS_KEY}_${dataset}`, JSON.stringify(models));
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

// Helper to find duplicate run IDs
function getDuplicateRunIds(models: CompareModelEntry[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const model of models) {
    if (model.runId) {
      if (seen.has(model.runId)) {
        duplicates.add(model.runId);
      }
      seen.add(model.runId);
    }
  }
  return duplicates;
}

export function useCompare(options: UseCompareOptions): UseCompareReturn {
  const { dataset, isCompareMode } = options;

  const [models, setModelsState] = useState<CompareModelEntry[]>([]);
  const [datasetParams, setDatasetParamsState] = useState<CompareDatasetParams>(DEFAULT_COMPARE_PARAMS);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareError, setCompareError] = useState<TrainError | null>(null);

  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Compare history state
  const [compareHistory, setCompareHistory] = useState<CompareHistoryRun[]>([]);
  const [isLoadingCompareHistory, setIsLoadingCompareHistory] = useState(false);

  // Calculate duplicate run IDs
  const duplicateRunIds = useMemo(() => getDuplicateRunIds(models), [models]);

  // Load stored models and params when dataset changes
  useEffect(() => {
    const storedModels = getStoredModels(dataset);
    setModelsState(storedModels);
    const storedParams = getStoredParams(dataset);
    setDatasetParamsState(storedParams);
  }, [dataset]);

  // Fetch history when Compare mode is active (all models for this dataset)
  useEffect(() => {
    if (!isCompareMode) return;

    async function fetchHistory() {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(`/api/history?dataset=${dataset}`);
        const data = await response.json();
        setHistory(data.runs || []);
      } catch {
        setHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [dataset, isCompareMode]);

  const removeModel = useCallback((id: string) => {
    setModelsState((prev) => {
      const newModels = ensureEmptyModel(prev.filter((m) => m.id !== id));
      storeModels(dataset, newModels);
      return newModels;
    });
  }, [dataset]);

  const updateModelType = useCallback((id: string, modelType: CompareModelEntry['modelType']) => {
    setModelsState((prev) => {
      // When model type changes, clear the run selection
      const newModels = prev.map((m) => (m.id === id ? { ...m, modelType, runId: null } : m));
      storeModels(dataset, newModels);
      return newModels;
    });
  }, [dataset]);

  const updateModelRun = useCallback((id: string, runId: string | null) => {
    setModelsState((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, runId } : m));
      // When a run is selected, ensure there's still an empty row for adding more
      const newModels = ensureEmptyModel(updated);
      storeModels(dataset, newModels);
      return newModels;
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

  // Can compare if: at least one model selected, no duplicates
  const selectedModels = models.filter((m) => m.runId !== null);
  const canCompare = selectedModels.length > 0 && duplicateRunIds.size === 0;

  const runCompare = useCallback(async () => {
    if (!canCompare) return;

    setIsComparing(true);
    setCompareError(null);

    try {
      const modelIds = models
        .filter((m) => m.runId !== null)
        .map((m) => m.runId as string);

      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset,
          models: modelIds,
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
  }, [dataset, models, datasetParams, canCompare]);

  const clearCompareResult = useCallback(() => {
    setCompareResult(null);
    setCompareError(null);
  }, []);

  // Fetch compare history
  const fetchCompareHistory = useCallback(async () => {
    setIsLoadingCompareHistory(true);
    try {
      const response = await fetch(`/api/compare/history?dataset=${dataset}`);
      const data = await response.json();
      setCompareHistory(data.runs || []);
    } catch {
      setCompareHistory([]);
    } finally {
      setIsLoadingCompareHistory(false);
    }
  }, [dataset]);

  // Delete compare run
  const deleteCompareRun = useCallback(async (compareId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/compare/history/${compareId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data.success === true;
    } catch {
      return false;
    }
  }, []);

  // Rename compare run
  const renameCompareRun = useCallback(async (compareId: string, name: string | null): Promise<boolean> => {
    try {
      const response = await fetch('/api/compare/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compareId, name }),
      });
      const data = await response.json();
      return data.success === true;
    } catch {
      return false;
    }
  }, []);

  // Load models from a compare result into the models list
  const loadModelsFromResult = useCallback((result: CompareResult) => {
    const newModels: CompareModelEntry[] = result.models.map((m) => ({
      id: generateId(),
      modelType: m.model,
      runId: m.runId,
    }));
    const modelsWithEmpty = ensureEmptyModel(newModels);
    setModelsState(modelsWithEmpty);
    storeModels(dataset, modelsWithEmpty);
  }, [dataset]);

  return {
    models,
    removeModel,
    updateModelType,
    updateModelRun,
    duplicateRunIds,
    datasetParams,
    setDatasetParams,
    resetDatasetParams,
    isComparing,
    compareResult,
    compareError,
    runCompare,
    clearCompareResult,
    canCompare,
    history,
    isLoadingHistory,
    // Compare history
    compareHistory,
    isLoadingCompareHistory,
    fetchCompareHistory,
    deleteCompareRun,
    renameCompareRun,
    setCompareResult,
    loadModelsFromResult,
  };
}
