import type { DatasetId } from './dataset';
import type { ModelId } from './model';

export interface DatasetParams {
  mask: number;
  split: number;
  ignore_columns: number[];
  impute: boolean;
}

export const DEFAULT_DATASET_PARAMS: DatasetParams = {
  mask: 0,
  split: 30,
  ignore_columns: [],
  impute: false,
};

export interface TreeParams {
  criterion: 'gini' | 'entropy' | 'log_loss';
  splitter: 'best' | 'random';
  max_depth: number | null;
  min_samples_split: number;
  min_samples_leaf: number;
  max_features: 'sqrt' | 'log2' | null;
  max_leaf_nodes: number | null;
  min_impurity_decrease: number;
  ccp_alpha: number;
  class_weight: 'balanced' | null;
}

export interface ForestParams {
  n_estimators: number;
  criterion: 'gini' | 'entropy' | 'log_loss';
  max_depth: number | null;
  min_samples_split: number;
  min_samples_leaf: number;
  max_features: 'sqrt' | 'log2' | null;
  max_leaf_nodes: number | null;
  min_impurity_decrease: number;
  bootstrap: boolean;
  oob_score: boolean;
  max_samples: number | null;
  ccp_alpha: number;
  warm_start: boolean;
  n_jobs: number | null;
  class_weight: 'balanced' | 'balanced_subsample' | null;
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
  l2_regularization: number;
  validation_fraction: number;
  n_iter_no_change: number;
  tol: number;
  warm_start: boolean;
  class_weight: 'balanced' | null;
  scoring: 'accuracy' | 'loss' | null;
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
    max_leaf_nodes: null,
    min_impurity_decrease: 0,
    ccp_alpha: 0,
    class_weight: null,
  },
  Income: {
    criterion: 'gini',
    splitter: 'best',
    max_depth: 10,
    min_samples_split: 20,
    min_samples_leaf: 10,
    max_features: null,
    max_leaf_nodes: null,
    min_impurity_decrease: 0,
    ccp_alpha: 0,
    class_weight: 'balanced',
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
    max_leaf_nodes: null,
    min_impurity_decrease: 0,
    bootstrap: true,
    oob_score: true,
    max_samples: 100,
    ccp_alpha: 0,
    warm_start: false,
    n_jobs: null,
    class_weight: null,
  },
  Income: {
    n_estimators: 100,
    criterion: 'gini',
    max_depth: 10,
    min_samples_split: 20,
    min_samples_leaf: 10,
    max_features: 'sqrt',
    max_leaf_nodes: null,
    min_impurity_decrease: 0,
    bootstrap: true,
    oob_score: false,
    max_samples: null,
    ccp_alpha: 0,
    warm_start: false,
    n_jobs: null,
    class_weight: 'balanced',
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
    l2_regularization: 0,
    validation_fraction: 0.1,
    n_iter_no_change: 10,
    tol: 1e-7,
    warm_start: false,
    class_weight: null,
    scoring: null,
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
    l2_regularization: 0,
    validation_fraction: 0.1,
    n_iter_no_change: 10,
    tol: 1e-7,
    warm_start: false,
    class_weight: 'balanced',
    scoring: 'loss',
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
