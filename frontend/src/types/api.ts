import type { DatasetId } from './dataset';
import type { ModelId } from './model';
import type { DatasetParams, ModelParams } from './params';

export interface TrainRequest {
  dataset: DatasetId;
  model: ModelId;
  datasetParams: DatasetParams;
  modelParams: ModelParams;
}

export interface ClassMetrics {
  label: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

export interface AggregateMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

export interface ClassificationReport {
  classes: ClassMetrics[];
  accuracy: number;
  macroAvg: AggregateMetrics;
  weightedAvg: AggregateMetrics;
}

export interface ModelInfo {
  type: ModelId;
  nIterations?: number;
  nEstimators?: number;
  oobScore?: number;
  treeDepth?: number;
  nLeaves?: number;
}

export interface TrainResult {
  accuracy: number;
  accuracyPercent: string;
  classificationReport: ClassificationReport;
  modelInfo?: ModelInfo;
  executionTime: number;
}

export type ErrorCode =
  | 'SCRIPT_NOT_FOUND'
  | 'SCRIPT_EXECUTION_ERROR'
  | 'INVALID_JSON_OUTPUT'
  | 'INVALID_PARAMS'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface TrainError {
  message: string;
  code: ErrorCode;
  details?: string;
  stackTrace?: string;
}

export interface TrainSuccessResponse {
  success: true;
  data: TrainResult;
}

export interface TrainErrorResponse {
  success: false;
  error: TrainError;
}

export type TrainResponse = TrainSuccessResponse | TrainErrorResponse;
