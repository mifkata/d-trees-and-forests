'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DatasetId } from '@/types/dataset';
import type { ModelId } from '@/types/model';
import type { DatasetParams, ModelParams } from '@/types/params';
import { DEFAULT_DATASET_PARAMS, getDefaultModelParams } from '@/types/params';
import { storage } from '@/lib/storage';

export interface UseParamsCacheReturn {
  dataset: DatasetId;
  model: ModelId;
  datasetParams: DatasetParams;
  modelParams: ModelParams;
  setDataset: (dataset: DatasetId) => void;
  setModel: (model: ModelId) => void;
  setDatasetParams: (params: Partial<DatasetParams>) => void;
  setModelParams: (params: Partial<ModelParams>) => void;
  resetDatasetParams: () => void;
  resetModelParams: () => void;
  isHydrated: boolean;
}

export function useParamsCache(): UseParamsCacheReturn {
  const [isHydrated, setIsHydrated] = useState(false);
  const [dataset, setDatasetState] = useState<DatasetId>('Iris');
  const [model, setModelState] = useState<ModelId>('tree');
  const [datasetParams, setDatasetParamsState] = useState<DatasetParams>(DEFAULT_DATASET_PARAMS);
  const [modelParams, setModelParamsState] = useState<ModelParams>(getDefaultModelParams('tree', 'Iris'));

  // Restore from localStorage on mount
  useEffect(() => {
    const lastSelection = storage.getLastSelection();
    const restoredDataset = lastSelection?.dataset ?? 'Iris';
    const restoredModel = lastSelection?.model ?? 'tree';

    setDatasetState(restoredDataset);
    setModelState(restoredModel);
    setDatasetParamsState(storage.getDatasetParams(restoredDataset, restoredModel));
    setModelParamsState(storage.getModelParams(restoredDataset, restoredModel));
    setIsHydrated(true);
  }, []);

  const setDataset = useCallback((newDataset: DatasetId) => {
    // Save current params before switching
    storage.setDatasetParams(dataset, model, datasetParams);
    storage.setModelParams(dataset, model, modelParams);

    // Load params for new combo
    const newDatasetParams = storage.getDatasetParams(newDataset, model);
    const newModelParams = storage.getModelParams(newDataset, model);

    setDatasetState(newDataset);
    setDatasetParamsState(newDatasetParams);
    setModelParamsState(newModelParams);
    storage.setLastSelection({ dataset: newDataset, model });
  }, [dataset, model, datasetParams, modelParams]);

  const setModel = useCallback((newModel: ModelId) => {
    // Save current params before switching
    storage.setDatasetParams(dataset, model, datasetParams);
    storage.setModelParams(dataset, model, modelParams);

    // Load params for new combo
    const newDatasetParams = storage.getDatasetParams(dataset, newModel);
    const newModelParams = storage.getModelParams(dataset, newModel);

    setModelState(newModel);
    setDatasetParamsState(newDatasetParams);
    setModelParamsState(newModelParams);
    storage.setLastSelection({ dataset, model: newModel });
  }, [dataset, model, datasetParams, modelParams]);

  const setDatasetParams = useCallback((params: Partial<DatasetParams>) => {
    setDatasetParamsState((prev) => {
      const newParams = { ...prev, ...params };
      storage.setDatasetParams(dataset, model, newParams);
      return newParams;
    });
  }, [dataset, model]);

  const setModelParams = useCallback((params: Partial<ModelParams>) => {
    setModelParamsState((prev) => {
      const newParams = { ...prev, ...params } as ModelParams;
      storage.setModelParams(dataset, model, newParams);
      return newParams;
    });
  }, [dataset, model]);

  const resetDatasetParams = useCallback(() => {
    setDatasetParamsState(DEFAULT_DATASET_PARAMS);
    storage.setDatasetParams(dataset, model, DEFAULT_DATASET_PARAMS);
  }, [dataset, model]);

  const resetModelParams = useCallback(() => {
    const defaults = getDefaultModelParams(model, dataset);
    setModelParamsState(defaults);
    storage.setModelParams(dataset, model, defaults);
  }, [dataset, model]);

  return {
    dataset,
    model,
    datasetParams,
    modelParams,
    setDataset,
    setModel,
    setDatasetParams,
    setModelParams,
    resetDatasetParams,
    resetModelParams,
    isHydrated,
  };
}
