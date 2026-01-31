'use client';

import { Button, Select, Card, CardHeader, CardTitle, Badge } from './ui';
import type { CompareSelection, CompareResult, HistoryRun } from '@/hooks/useCompare';

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

interface ModelHistorySelectProps {
  label: string;
  runs: HistoryRun[];
  value: string | null;
  onChange: (value: string | null) => void;
  isLoading?: boolean;
}

export function ModelHistorySelect({
  label,
  runs,
  value,
  onChange,
  isLoading,
}: ModelHistorySelectProps) {
  // Sort runs: named first (alphabetically), then unnamed (alphabetically by ID)
  const sortedRuns = [...runs].sort((a, b) => {
    const aHasName = Boolean(a.name);
    const bHasName = Boolean(b.name);

    // Named runs come first
    if (aHasName && !bHasName) return -1;
    if (!aHasName && bHasName) return 1;

    // Within same group, sort alphabetically
    const aLabel = a.name ? a.name.replace(/_/g, ' ') : a.runId;
    const bLabel = b.name ? b.name.replace(/_/g, ' ') : b.runId;
    return aLabel.localeCompare(bLabel);
  });

  const options = [
    { value: '', label: 'Select run...' },
    ...sortedRuns.map((run) => ({
      value: run.runId,
      label: `${run.name ? run.name.replace(/_/g, ' ') : run.runId} - ${(run.accuracy * 100).toFixed(2)}% - ${formatTimeAgo(run.timestamp)}`,
    })),
  ];

  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700 w-40">{label}:</label>
      <div className="flex-1">
        <Select
          options={options}
          value={value || ''}
          onChange={(val) => onChange(val || null)}
          disabled={isLoading}
        />
      </div>
      {value && (
        <Badge variant="success" className="ml-2">
          Selected
        </Badge>
      )}
    </div>
  );
}

interface CompareModelsTabProps {
  selection: CompareSelection;
  onSelectionChange: (key: keyof CompareSelection, value: string | null) => void;
  historyTree: HistoryRun[];
  historyForest: HistoryRun[];
  historyGradient: HistoryRun[];
  historyHistGradient: HistoryRun[];
  isLoadingHistory: boolean;
}

export function CompareModelsTab({
  selection,
  onSelectionChange,
  historyTree,
  historyForest,
  historyGradient,
  historyHistGradient,
  isLoadingHistory,
}: CompareModelsTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Select one trained model of each type to compare their performance.
      </p>

      <ModelHistorySelect
        label="Decision Tree"
        runs={historyTree}
        value={selection.tree}
        onChange={(val) => onSelectionChange('tree', val)}
        isLoading={isLoadingHistory}
      />

      <ModelHistorySelect
        label="Random Forest"
        runs={historyForest}
        value={selection.forest}
        onChange={(val) => onSelectionChange('forest', val)}
        isLoading={isLoadingHistory}
      />

      <ModelHistorySelect
        label="Gradient Boosting"
        runs={historyGradient}
        value={selection.gradient}
        onChange={(val) => onSelectionChange('gradient', val)}
        isLoading={isLoadingHistory}
      />

      <ModelHistorySelect
        label="Hist Gradient Boosting"
        runs={historyHistGradient}
        value={selection['hist-gradient']}
        onChange={(val) => onSelectionChange('hist-gradient', val)}
        isLoading={isLoadingHistory}
      />

      {!isLoadingHistory && historyTree.length === 0 && historyForest.length === 0 && historyGradient.length === 0 && historyHistGradient.length === 0 && (
        <p className="text-sm text-amber-600 mt-4">
          No training history found for this dataset. Train some models first.
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
  label,
  model
}: {
  label: string;
  model: { trainAccuracy: number; compareAccuracy: number; runId: string; name?: string }
}) {
  const ratio = model.compareAccuracy / model.trainAccuracy;
  const displayName = model.name ? model.name.replace(/_/g, ' ') : null;
  return (
    <div className={`p-3 rounded-lg border ${getBoxBackground(ratio)} ${getBorderColor(ratio)}`}>
      <div className="text-center mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 font-mono">
          {displayName || model.runId}
        </p>
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
          {result.models.tree && (
            <ModelAccuracyCard label="Decision Tree" model={result.models.tree} />
          )}
          {result.models.forest && (
            <ModelAccuracyCard label="Random Forest" model={result.models.forest} />
          )}
          {result.models.gradient && (
            <ModelAccuracyCard label="Gradient Boosting" model={result.models.gradient} />
          )}
          {result.models['hist-gradient'] && (
            <ModelAccuracyCard label="Hist Gradient" model={result.models['hist-gradient']} />
          )}
        </div>
      </div>
    </Card>
  );
}

