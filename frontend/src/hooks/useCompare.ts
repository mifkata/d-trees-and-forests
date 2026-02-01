'use client';

import { useState, useEffect, useCallback } from 'react';
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
  sequence: boolean;
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
  models?: CompareModelResult[];
  sequence?: boolean;
  results?: Record<string, { models: Array<{ runId: string; model: string; name?: string; accuracy: number; imputed?: boolean }> }>;
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
  addModel: (runId: string, modelType: string) => void;
  addAllModels: () => void;
  clearAllModels: () => void;
}

const COMPARE_MODELS_KEY = 'compare_models';
const COMPARE_PARAMS_KEY = 'compare_params';

const DEFAULT_COMPARE_PARAMS: CompareDatasetParams = {
  mask: 0,
  impute: false,
  ignore_columns: [],
  sequence: false,
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

  // Can compare if at least one model is selected
  const selectedModels = models.filter((m) => m.runId !== null);
  const canCompare = selectedModels.length > 0;

  const runCompare = useCallback(async () => {
    if (!canCompare) return;

    setIsComparing(true);
    setCompareError(null);

    try {
      const modelIds = models
        .filter((m) => m.runId !== null)
        .map((m) => m.runId as string);

      // Build request body based on sequence mode
      const requestBody = datasetParams.sequence
        ? {
            dataset,
            models: modelIds,
            sequence: true,
          }
        : {
            dataset,
            models: modelIds,
            mask: datasetParams.mask,
            impute: datasetParams.mask > 0 && datasetParams.impute,
            // ignore_columns not sent - determined from model's runtime.json
          };

      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
    if (!result.models) return;
    const newModels: CompareModelEntry[] = result.models.map((m) => ({
      id: generateId(),
      modelType: m.model,
      runId: m.runId,
    }));
    const modelsWithEmpty = ensureEmptyModel(newModels);
    setModelsState(modelsWithEmpty);
    storeModels(dataset, modelsWithEmpty);
  }, [dataset]);

  // Add a single model to the compare list if not already present
  const addModel = useCallback((runId: string, modelType: string) => {
    setModelsState((prev) => {
      // Check if model with this runId already exists
      const exists = prev.some((m) => m.runId === runId);
      if (exists) return prev;

      const newEntry: CompareModelEntry = {
        id: generateId(),
        modelType: modelType as CompareModelEntry['modelType'],
        runId,
      };
      const newModels = ensureEmptyModel([...prev.filter((m) => m.runId !== null), newEntry]);
      storeModels(dataset, newModels);
      return newModels;
    });
  }, [dataset]);

  // Add all models from history to the compare list
  const addAllModels = useCallback(() => {
    // Sort history: by model type, then named runs before unnamed, then by name/id
    const sortedHistory = [...history].sort((a, b) => {
      // First sort by model type
      if (a.model !== b.model) {
        return a.model.localeCompare(b.model);
      }
      // Then named runs come before unnamed runs
      const aHasName = !!a.name;
      const bHasName = !!b.name;
      if (aHasName !== bHasName) {
        return aHasName ? -1 : 1;
      }
      // Finally sort by name (if both have names) or runId (if both unnamed)
      const aKey = a.name || a.runId;
      const bKey = b.name || b.runId;
      return aKey.localeCompare(bKey);
    });

    const newModels: CompareModelEntry[] = sortedHistory.map((run) => ({
      id: generateId(),
      modelType: run.model as CompareModelEntry['modelType'],
      runId: run.runId,
    }));
    const modelsWithEmpty = ensureEmptyModel(newModels);
    setModelsState(modelsWithEmpty);
    storeModels(dataset, modelsWithEmpty);
  }, [dataset, history]);

  // Clear all models from the compare list
  const clearAllModels = useCallback(() => {
    const emptyModels = [createEmptyModel()];
    setModelsState(emptyModels);
    storeModels(dataset, emptyModels);
  }, [dataset]);

  return {
    models,
    removeModel,
    updateModelType,
    updateModelRun,
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
    addModel,
    addAllModels,
    clearAllModels,
  };
}
