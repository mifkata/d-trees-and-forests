import type { DatasetId } from './dataset';
import type { ModelId } from './model';

export interface DatasetParams {
  mask: number;
  split: number;
  ignore_columns: number[];
  impute: boolean;
  use_output: boolean;
  images: boolean;
}

export const DEFAULT_DATASET_PARAMS: DatasetParams = {
  mask: 0,
  split: 30,
  ignore_columns: [],
  impute: false,
  use_output: false,
  images: false,
};

export interface TreeParams {
  criterion: 'gini' | 'entropy' | 'log_loss';
  splitter: 'best' | 'random';
  max_depth: number | null;
  min_samples_split: number;
  min_samples_leaf: number;
  max_features: 'sqrt' | 'log2' | null;
}

export interface ForestParams {
  n_estimators: number;
  criterion: 'gini' | 'entropy' | 'log_loss';
  max_depth: number | null;
  min_samples_split: number;
  min_samples_leaf: number;
  max_features: 'sqrt' | 'log2' | null;
  bootstrap: boolean;
  oob_score: boolean;
  max_samples: number | null;
}

export interface GradientParams {
  loss: 'log_loss';
  learning_rate: number;
  max_iter: number;
  max_leaf_nodes: number | null;
  max_depth: number | null;
  min_samples_leaf: number;
  max_bins: number;
  early_stopping: boolean | 'auto';
}

export type ModelParams = TreeParams | ForestParams | GradientParams;

export const DEFAULT_TREE_PARAMS: Record<DatasetId, TreeParams> = {
  Iris: {
    criterion: 'gini',
    splitter: 'best',
    max_depth: null,
    min_samples_split: 2,
    min_samples_leaf: 1,
    max_features: null,
  },
  Income: {
    criterion: 'gini',
    splitter: 'best',
    max_depth: 10,
    min_samples_split: 20,
    min_samples_leaf: 10,
    max_features: null,
  },
};

export const DEFAULT_FOREST_PARAMS: Record<DatasetId, ForestParams> = {
  Iris: {
    n_estimators: 10,
    criterion: 'gini',
    max_depth: 3,
    min_samples_split: 2,
    min_samples_leaf: 1,
    max_features: 'sqrt',
    bootstrap: true,
    oob_score: true,
    max_samples: 100,
  },
  Income: {
    n_estimators: 100,
    criterion: 'gini',
    max_depth: 10,
    min_samples_split: 20,
    min_samples_leaf: 10,
    max_features: 'sqrt',
    bootstrap: true,
    oob_score: false,
    max_samples: null,
  },
};

export const DEFAULT_GRADIENT_PARAMS: Record<DatasetId, GradientParams> = {
  Iris: {
    loss: 'log_loss',
    learning_rate: 0.2,
    max_iter: 200,
    max_leaf_nodes: 31,
    max_depth: 4,
    min_samples_leaf: 1,
    max_bins: 255,
    early_stopping: false,
  },
  Income: {
    loss: 'log_loss',
    learning_rate: 0.1,
    max_iter: 200,
    max_leaf_nodes: 31,
    max_depth: 6,
    min_samples_leaf: 20,
    max_bins: 255,
    early_stopping: 'auto',
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
