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

function formatDiff(diff: number): string {
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${(diff * 100).toFixed(1)}%`;
}

function getDiffColor(diff: number): string {
  if (diff >= 0.10) return 'text-green-800';      // +10%+
  if (diff > 0) return 'text-green-600';          // any improvement
  if (diff === 0) return 'text-gray-500';         // no change
  if (diff >= -0.05) return 'text-yellow-600';    // up to -5%
  if (diff >= -0.10) return 'text-orange-500';    // up to -10%
  if (diff >= -0.20) return 'text-red-400';       // up to -20%
  if (diff >= -0.30) return 'text-red-500';       // up to -30%
  if (diff >= -0.40) return 'text-red-600';       // up to -40%
  return 'text-red-800';                          // -40%+
}

function getBoxBackground(diff: number): string {
  if (diff >= 0.10) return 'bg-green-100';
  if (diff > 0) return 'bg-green-50';
  if (diff === 0) return 'bg-gray-50';
  if (diff >= -0.05) return 'bg-yellow-50';
  if (diff >= -0.10) return 'bg-orange-50';
  if (diff >= -0.20) return 'bg-red-50';
  return 'bg-red-100';
}

function getBorderColor(diff: number): string {
  if (diff >= 0.10) return 'border-green-400';
  if (diff > 0) return 'border-green-300';
  if (diff === 0) return 'border-gray-300';
  if (diff >= -0.05) return 'border-yellow-300';
  if (diff >= -0.10) return 'border-orange-300';
  if (diff >= -0.20) return 'border-red-300';
  return 'border-red-400';
}

const MODEL_EMOJI: Record<string, string> = {
  'tree': '🌳',
  'forest': '🌲',
  'gradient': '🚀',
  'hist-gradient': '📊',
};

function ModelAccuracyCard({
  model
}: {
  model: { model: string; runId: string; name?: string; trainAccuracy: number; compareAccuracy: number; imputed?: boolean }
}) {
  const diff = model.compareAccuracy - model.trainAccuracy;
  const displayName = model.name ? model.name.replace(/_/g, ' ') : model.runId;
  const modelLabel = getModelLabel(model.model);
  const emoji = MODEL_EMOJI[model.model] || '';

  return (
    <div className={`p-3 rounded-lg border ${getBoxBackground(diff)} ${getBorderColor(diff)}`}>
      <div className="flex justify-between">
        <p className="text-sm font-medium text-gray-900">{displayName}</p>
        <p className="text-xs text-gray-500">{modelLabel} {emoji}</p>
      </div>
      <div className="flex justify-between items-end">
        <div className="text-left">
          <div className="text-xs text-gray-400">Train</div>
          <div className="text-sm font-medium">{(model.trainAccuracy * 100).toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">Compare</div>
          <div className={`font-bold text-xl ${getDiffColor(diff)}`}>{(model.compareAccuracy * 100).toFixed(1)}%</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Diff{model.imputed ? ' (imputed)' : ''}</div>
          <div className={`text-sm font-medium ${getDiffColor(diff)}`}>{formatDiff(diff)}</div>
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
        <div className="space-y-3">
          {result.models.map((model) => (
            <ModelAccuracyCard key={model.runId} model={model} />
          ))}
        </div>
      </div>
    </Card>
  );
}
