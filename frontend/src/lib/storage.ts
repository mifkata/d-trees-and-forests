import type { DatasetId } from '@/types/dataset';
import type { ModelId } from '@/types/model';
import type { DatasetParams, ModelParams } from '@/types/params';
import { DEFAULT_DATASET_PARAMS, getDefaultModelParams } from '@/types/params';

const STORAGE_PREFIX = 'd-trees';

function getDatasetParamsKey(dataset: DatasetId, model: ModelId): string {
  return `${STORAGE_PREFIX}:dataset-params:${dataset}:${model}`;
}

function getModelParamsKey(dataset: DatasetId, model: ModelId): string {
  return `${STORAGE_PREFIX}:model-params:${dataset}:${model}`;
}

function getLastSelectionKey(): string {
  return `${STORAGE_PREFIX}:last-selection`;
}

export interface LastSelection {
  dataset: DatasetId;
  model: ModelId;
}

function safeGetItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

export const storage = {
  getDatasetParams(dataset: DatasetId, model: ModelId): DatasetParams {
    const cached = safeGetItem<DatasetParams>(getDatasetParamsKey(dataset, model));
    return cached ?? { ...DEFAULT_DATASET_PARAMS };
  },

  getModelParams(dataset: DatasetId, model: ModelId): ModelParams {
    const cached = safeGetItem<ModelParams>(getModelParamsKey(dataset, model));
    return cached ?? getDefaultModelParams(model, dataset);
  },

  getLastSelection(): LastSelection | null {
    return safeGetItem<LastSelection>(getLastSelectionKey());
  },

  setDatasetParams(dataset: DatasetId, model: ModelId, params: DatasetParams): void {
    safeSetItem(getDatasetParamsKey(dataset, model), params);
  },

  setModelParams(dataset: DatasetId, model: ModelId, params: ModelParams): void {
    safeSetItem(getModelParamsKey(dataset, model), params);
  },

  setLastSelection(selection: LastSelection): void {
    safeSetItem(getLastSelectionKey(), selection);
  },

  clearAll(): void {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  },
};
