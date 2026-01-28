import type { DatasetId } from './dataset';
import type { ModelId } from './model';

export interface DatasetParams {
  mask: number;
  impute: boolean;
  useOutput: boolean;
  images: boolean;
}

export const DEFAULT_DATASET_PARAMS: DatasetParams = {
  mask: 0,
  impute: false,
  useOutput: false,
  images: false,
};

export interface TreeParams {
  criterion: 'gini' | 'entropy' | 'log_loss';
  splitter: 'best' | 'random';
  maxDepth: number | null;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  maxFeatures: 'sqrt' | 'log2' | null;
}

export interface ForestParams {
  nEstimators: number;
  criterion: 'gini' | 'entropy' | 'log_loss';
  maxDepth: number | null;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  maxFeatures: 'sqrt' | 'log2' | null;
  bootstrap: boolean;
  oobScore: boolean;
  maxSamples: number | null;
}

export interface GradientParams {
  loss: 'log_loss';
  learningRate: number;
  maxIter: number;
  maxLeafNodes: number | null;
  maxDepth: number | null;
  minSamplesLeaf: number;
  maxBins: number;
  earlyStopping: boolean | 'auto';
}

export type ModelParams = TreeParams | ForestParams | GradientParams;

export const DEFAULT_TREE_PARAMS: Record<DatasetId, TreeParams> = {
  Iris: {
    criterion: 'gini',
    splitter: 'best',
    maxDepth: null,
    minSamplesSplit: 2,
    minSamplesLeaf: 1,
    maxFeatures: null,
  },
  Income: {
    criterion: 'gini',
    splitter: 'best',
    maxDepth: 10,
    minSamplesSplit: 20,
    minSamplesLeaf: 10,
    maxFeatures: null,
  },
};

export const DEFAULT_FOREST_PARAMS: Record<DatasetId, ForestParams> = {
  Iris: {
    nEstimators: 10,
    criterion: 'gini',
    maxDepth: 3,
    minSamplesSplit: 2,
    minSamplesLeaf: 1,
    maxFeatures: 'sqrt',
    bootstrap: true,
    oobScore: true,
    maxSamples: 100,
  },
  Income: {
    nEstimators: 100,
    criterion: 'gini',
    maxDepth: 10,
    minSamplesSplit: 20,
    minSamplesLeaf: 10,
    maxFeatures: 'sqrt',
    bootstrap: true,
    oobScore: false,
    maxSamples: null,
  },
};

export const DEFAULT_GRADIENT_PARAMS: Record<DatasetId, GradientParams> = {
  Iris: {
    loss: 'log_loss',
    learningRate: 0.2,
    maxIter: 200,
    maxLeafNodes: 31,
    maxDepth: 4,
    minSamplesLeaf: 1,
    maxBins: 255,
    earlyStopping: false,
  },
  Income: {
    loss: 'log_loss',
    learningRate: 0.1,
    maxIter: 200,
    maxLeafNodes: 31,
    maxDepth: 6,
    minSamplesLeaf: 20,
    maxBins: 255,
    earlyStopping: 'auto',
  },
};

export function getDefaultModelParams(model: ModelId, dataset: DatasetId): ModelParams {
  switch (model) {
    case 'tree':
      return { ...DEFAULT_TREE_PARAMS[dataset] };
    case 'forest':
      return { ...DEFAULT_FOREST_PARAMS[dataset] };
    case 'gradient':
      return { ...DEFAULT_GRADIENT_PARAMS[dataset] };
  }
}
