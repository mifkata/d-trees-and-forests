'use client';

import { Button, Select, Card, CardHeader, CardTitle, Badge } from './ui';
import type { CompareModelEntry, CompareResult, HistoryRun } from '@/hooks/useCompare';

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

function getModelLabel(model: string): string {
  switch (model) {
    case 'tree': return 'Tree';
    case 'forest': return 'Forest';
    case 'gradient': return 'Gradient';
    case 'hist-gradient': return 'Hist Gradient';
    default: return model;
  }
}

type ModelType = 'tree' | 'forest' | 'gradient' | 'hist-gradient';

const MODEL_TYPE_OPTIONS = [
  { value: '', label: 'Select model...' },
  { value: 'tree', label: 'Decision Tree' },
  { value: 'forest', label: 'Random Forest' },
  { value: 'gradient', label: 'Gradient Boosting' },
  { value: 'hist-gradient', label: 'Hist Gradient' },
];

interface ModelRowProps {
  allRuns: HistoryRun[];
  modelType: ModelType | null;
  runId: string | null;
  onModelTypeChange: (modelType: ModelType | null) => void;
  onRunChange: (runId: string | null) => void;
  onRemove: () => void;
  isDuplicate: boolean;
  isLoading?: boolean;
  canRemove?: boolean;
}

export function ModelRow({
  allRuns,
  modelType,
  runId,
  onModelTypeChange,
  onRunChange,
  onRemove,
  isDuplicate,
  isLoading,
  canRemove = true,
}: ModelRowProps) {
  // Filter runs by selected model type
  const filteredRuns = modelType
    ? allRuns.filter((run) => run.model === modelType)
    : [];

  // Sort runs: named first (alphabetically with numeric), then unnamed (alphabetically by ID)
  const sortedRuns = [...filteredRuns].sort((a, b) => {
    const aHasName = Boolean(a.name);
    const bHasName = Boolean(b.name);

    // Named runs come first
    if (aHasName && !bHasName) return -1;
    if (!aHasName && bHasName) return 1;

    // Within same group, sort alphabetically with numeric comparison
    const aLabel = a.name ? a.name.replace(/_/g, ' ') : a.runId;
    const bLabel = b.name ? b.name.replace(/_/g, ' ') : b.runId;
    return aLabel.localeCompare(bLabel, undefined, { numeric: true, sensitivity: 'base' });
  });

  const runOptions = [
    { value: '', label: modelType ? 'Select run...' : 'Select model first' },
    ...sortedRuns.map((run) => ({
      value: run.runId,
      label: `${run.name ? run.name.replace(/_/g, ' ') : run.runId} - ${(run.accuracy * 100).toFixed(2)}% - ${formatTimeAgo(run.timestamp)}`,
    })),
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="w-44 shrink-0">
        <Select
          options={MODEL_TYPE_OPTIONS}
          value={modelType || ''}
          onChange={(val) => onModelTypeChange((val || null) as ModelType | null)}
          disabled={isLoading}
        />
      </div>
      <div className="flex-1">
        <Select
          options={runOptions}
          value={runId || ''}
          onChange={(val) => onRunChange(val || null)}
          disabled={isLoading || !modelType}
          error={isDuplicate}
        />
      </div>
      {isDuplicate && (
        <Badge variant="error" className="shrink-0">
          Duplicate
        </Badge>
      )}
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove model"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      ) : (
        <div className="w-9" /> // Spacer to maintain alignment
      )}
    </div>
  );
}

interface CompareModelsListProps {
  models: CompareModelEntry[];
  history: HistoryRun[];
  duplicateRunIds: Set<string>;
  onRemoveModel: (id: string) => void;
  onUpdateModelType: (id: string, modelType: CompareModelEntry['modelType']) => void;
  onUpdateModelRun: (id: string, runId: string | null) => void;
  isLoadingHistory: boolean;
}

export function CompareModelsList({
  models,
  history,
  duplicateRunIds,
  onRemoveModel,
  onUpdateModelType,
  onUpdateModelRun,
  isLoadingHistory,
}: CompareModelsListProps) {
  // Separate filled models from the empty one at the end
  const filledModels = models.filter((m) => m.runId !== null);
  const emptyModel = models.find((m) => m.runId === null);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Models to Compare</h4>

      <div className="space-y-2">
        {/* Filled models (can be removed) */}
        {filledModels.map((model) => (
          <ModelRow
            key={model.id}
            allRuns={history}
            modelType={model.modelType}
            runId={model.runId}
            onModelTypeChange={(modelType) => onUpdateModelType(model.id, modelType)}
            onRunChange={(runId) => onUpdateModelRun(model.id, runId)}
            onRemove={() => onRemoveModel(model.id)}
            isDuplicate={model.runId !== null && duplicateRunIds.has(model.runId)}
            isLoading={isLoadingHistory}
            canRemove={true}
          />
        ))}

        {/* Always show one empty row for adding new models */}
        {emptyModel && (
          <ModelRow
            key={emptyModel.id}
            allRuns={history}
            modelType={emptyModel.modelType}
            runId={emptyModel.runId}
            onModelTypeChange={(modelType) => onUpdateModelType(emptyModel.id, modelType)}
            onRunChange={(runId) => onUpdateModelRun(emptyModel.id, runId)}
            onRemove={() => {}}
            isDuplicate={false}
            isLoading={isLoadingHistory}
            canRemove={false}
          />
        )}
      </div>

      {!isLoadingHistory && history.length === 0 && (
        <p className="text-sm text-amber-600 mt-2">
          No training history found for this dataset. Train some models first.
        </p>
      )}

      {duplicateRunIds.size > 0 && (
        <p className="text-sm text-red-600 mt-2">
          Remove duplicate selections to enable comparison.
        </p>
      )}
    </div>
  );
}

interface CompareButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function CompareButton({ loading, disabled, onClick }: CompareButtonProps) {
  return (
    <Button
      type="button"
      fullWidth
      loading={loading}
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? 'Comparing...' : 'Compare Models'}
    </Button>
  );
}

interface CompareResultsProps {
  result: CompareResult;
}

function formatRatio(ratio: number): string {
  if (ratio >= 1) {
    return `+${((ratio - 1) * 100).toFixed(1)}%`;
  }
  return `-${((1 - ratio) * 100).toFixed(1)}%`;
}

function getRatioColor(ratio: number): string {
  if (ratio >= 1) return 'text-green-600';
  if (ratio >= 0.95) return 'text-yellow-600';
  if (ratio >= 0.90) return 'text-orange-600';
  return 'text-red-600';
}

function getRatioIcon(ratio: number): string {
  if (ratio >= 1) return '↑';
  if (ratio >= 0.99) return '→';
  return '↓';
}

function getBoxBackground(ratio: number): string {
  if (ratio >= 1) return 'bg-green-100';
  if (ratio >= 0.95) return 'bg-green-50';
  if (ratio >= 0.90) return 'bg-yellow-50';
  if (ratio >= 0.85) return 'bg-orange-50';
  return 'bg-red-50';
}

function getBorderColor(ratio: number): string {
  if (ratio >= 1) return 'border-green-300';
  if (ratio >= 0.95) return 'border-green-200';
  if (ratio >= 0.90) return 'border-yellow-300';
  if (ratio >= 0.85) return 'border-orange-300';
  return 'border-red-300';
}

function ModelAccuracyCard({
  model
}: {
  model: { model: string; runId: string; trainAccuracy: number; compareAccuracy: number; imputed?: boolean }
}) {
  const ratio = model.compareAccuracy / model.trainAccuracy;
  return (
    <div className={`p-3 rounded-lg border ${getBoxBackground(ratio)} ${getBorderColor(ratio)}`}>
      <div className="text-center mb-2">
        <p className="text-sm font-medium text-gray-700">{getModelLabel(model.model)}</p>
        <p className="text-xs text-gray-500 font-mono">{model.runId}</p>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Train:</span>
          <span className="font-medium">{(model.trainAccuracy * 100).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Compare:</span>
          <span className="font-bold">{(model.compareAccuracy * 100).toFixed(2)}%</span>
        </div>
        <div className={`flex justify-between border-t pt-1 mt-1 ${getBorderColor(ratio)}`}>
          <span className="text-gray-500">Diff:</span>
          <span className={`font-medium ${getRatioColor(ratio)}`}>
            {getRatioIcon(ratio)} {formatRatio(ratio)}
            {model.imputed && <span className="text-gray-400 ml-1">(imputed)</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CompareResults({ result }: CompareResultsProps) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Comparison Results</CardTitle>
      </CardHeader>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Model Accuracies</h4>
        <div className="space-y-4">
          {result.models.map((model) => (
            <ModelAccuracyCard key={model.runId} model={model} />
          ))}
        </div>
      </div>
    </Card>
  );
}
