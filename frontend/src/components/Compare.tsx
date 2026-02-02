'use client';

import { useState, useEffect } from 'react';
import { Button, Select, Card, CardHeader, CardTitle, Badge } from './ui';
import { ImagesDisplay } from './ResultsDisplay';
import type { CompareModelEntry, CompareResult, HistoryRun } from '@/hooks/useCompare';

type CompareSortOption = 'default' | 'compare-score' | 'model-score';

function SortIconButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 000 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 5a2 2 0 012-2h8.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V15a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0v10h10V6.414L13.586 5H5zm2 0v3h4V5H7zm1 7a2 2 0 114 0 2 2 0 01-4 0z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  );
}

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
  onAddAllModels?: () => void;
  onClearAllModels?: () => void;
  onCompare?: () => void;
  isComparing?: boolean;
  canCompare?: boolean;
}

export function CompareModelsList({
  models,
  history,
  duplicateRunIds,
  onRemoveModel,
  onUpdateModelType,
  onUpdateModelRun,
  isLoadingHistory,
  onAddAllModels,
  onClearAllModels,
  onCompare,
  isComparing,
  canCompare,
}: CompareModelsListProps) {
  // Separate filled models from the empty one at the end
  const filledModels = models.filter((m) => m.runId !== null);
  const emptyModel = models.find((m) => m.runId === null);
  const showTopCompareButton = filledModels.length >= 3 && !!onCompare;

  return (
    <div className="space-y-3">
      {showTopCompareButton && (
        <Button
          type="button"
          fullWidth
          loading={isComparing}
          disabled={!canCompare}
          onClick={onCompare}
        >
          {isComparing ? 'Comparing...' : 'Compare Models'}
        </Button>
      )}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Models to Compare{filledModels.length > 0 && ` (${filledModels.length})`}
        </h4>
        <div className="flex gap-1">
          {onAddAllModels && (
            <button
              type="button"
              onClick={onAddAllModels}
              disabled={isLoadingHistory || history.length === 0}
              className="text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
            >
              All models
            </button>
          )}
          {onClearAllModels && (
            <button
              type="button"
              onClick={onClearAllModels}
              disabled={filledModels.length === 0}
              className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

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
  onLoadModels?: () => void;
  onAddModel?: (runId: string, modelType: string) => void;
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

function getDiffBgColor(diff: number): string {
  if (diff >= 0.10) return 'bg-green-600';      // +10%+
  if (diff > 0) return 'bg-green-500';          // any improvement
  if (diff === 0) return 'bg-gray-400';         // no change
  if (diff >= -0.05) return 'bg-yellow-500';    // up to -5%
  if (diff >= -0.10) return 'bg-orange-500';    // up to -10%
  if (diff >= -0.20) return 'bg-red-400';       // up to -20%
  if (diff >= -0.30) return 'bg-red-500';       // up to -30%
  if (diff >= -0.40) return 'bg-red-600';       // up to -40%
  return 'bg-red-700';                          // -40%+
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

function switchToTrainMode() {
  localStorage.setItem('tab_mode', 'train');
}

function ModelAccuracyCard({
  model,
  onAddModel,
  showAddIcon,
}: {
  model: { model: string; runId: string; name?: string; trainAccuracy: number; compareAccuracy: number; imputed?: boolean };
  onAddModel?: (runId: string, modelType: string) => void;
  showAddIcon?: boolean;
}) {
  const diff = model.compareAccuracy - model.trainAccuracy;
  const displayName = model.name ? model.name.replace(/_/g, ' ') : model.runId;
  const modelLabel = getModelLabel(model.model);
  const emoji = MODEL_EMOJI[model.model] || '';

  return (
    <div className={`p-3 rounded-lg border ${getBoxBackground(diff)} ${getBorderColor(diff)}`}>
      <div className="flex justify-between">
        <div className="flex items-center gap-1.5">
          {showAddIcon && onAddModel && (
            <button
              type="button"
              onClick={() => onAddModel(model.runId, model.model)}
              title="Add to compare list"
              className="p-0.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <PlusIcon />
            </button>
          )}
          <a
            href={`/?run_id=${model.runId}`}
            onClick={switchToTrainMode}
            className="text-sm font-medium text-gray-900 hover:underline"
          >
            {displayName}
          </a>
        </div>
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

export function CompareResults({ result, onLoadModels, onAddModel }: CompareResultsProps) {
  const [sortBy, setSortBy] = useState<CompareSortOption>(() => {
    if (typeof window === 'undefined') return 'default';
    return (localStorage.getItem('compare_sort') as CompareSortOption) || 'default';
  });

  useEffect(() => {
    localStorage.setItem('compare_sort', sortBy);
  }, [sortBy]);


  // Sequence mode: show summary table with accuracy at each mask rate
  if (result.sequence && result.results) {
    const maskRates = ['0', '10', '20', '30', '40', '50', '60'];
    const imputeRates = ['10', '20', '30', '40', '50', '60'];

    // Get unique models - collect from all mask rates to find unique runIds
    const allModels = Object.values(result.results).flatMap(r => r.models || []);
    const seenRunIds = new Set<string>();
    const uniqueModels: Array<{ runId: string; model: string; name?: string }> = [];

    for (const m of allModels) {
      if (!seenRunIds.has(m.runId)) {
        seenRunIds.add(m.runId);
        uniqueModels.push({ runId: m.runId, model: m.model, name: m.name });
      }
    }

    if (uniqueModels.length === 0) {
      return (
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              {onLoadModels && (
                <button
                  type="button"
                  onClick={onLoadModels}
                  title="Load models into compare"
                  className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <SaveIcon />
                </button>
              )}
              <CardTitle>Sequence Comparison Results</CardTitle>
            </div>
          </CardHeader>
          <div>
            <p className="text-sm text-gray-600">No results available.</p>
          </div>
        </Card>
      );
    }

    // Get baseline accuracy from mask=0
    const baselineResults = result.results['0']?.models || [];

    // Helper to get accuracy for a model at a mask rate
    const getAccuracy = (runId: string, mask: string, imputed: boolean) => {
      const maskResults = result.results?.[mask]?.models || [];
      const modelResult = maskResults.find(
        m => m.runId === runId && (imputed ? m.imputed === true : m.imputed !== true)
      );
      return modelResult?.accuracy;
    };

    return (
      <>
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              {onLoadModels && (
                <button
                  type="button"
                  onClick={onLoadModels}
                  title="Load models into compare"
                  className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <SaveIcon />
                </button>
              )}
              <CardTitle>Sequence Comparison Results</CardTitle>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th rowSpan={2} className="text-left p-2 border-r border-gray-200 bg-gray-50">Model</th>
                  <th rowSpan={2} className="text-center p-2 border-r border-gray-200 bg-gray-50 w-8">T</th>
                  <th rowSpan={2} className="text-center p-2 border-r border-gray-200 bg-gray-50">Train</th>
                  <th colSpan={7} className="text-center p-1 border-r border-gray-200 bg-gray-100">Mask</th>
                  <th colSpan={6} className="text-center p-1 bg-gray-100">Impute</th>
                </tr>
                <tr className="border-b border-gray-300 bg-gray-50">
                  {maskRates.map(rate => (
                    <th key={`mask-${rate}`} className="text-center p-1 text-gray-500 font-normal border-r border-gray-100 last:border-r-gray-200">{rate}</th>
                  ))}
                  {imputeRates.map(rate => (
                    <th key={`impute-${rate}`} className="text-center p-1 text-gray-500 font-normal border-r border-gray-100 last:border-r-0">{rate}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueModels.map((model) => {
                  const emoji = MODEL_EMOJI[model.model] || '';
                  const displayName = model.name ? model.name.replace(/_/g, ' ') : model.runId;
                  const baselineAcc = baselineResults.find(m => m.runId === model.runId)?.accuracy || 0;

                  return (
                    <tr key={model.runId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2 border-r border-gray-200">
                        <a
                          href={`/?run_id=${model.runId}`}
                          onClick={switchToTrainMode}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {displayName}
                        </a>
                      </td>
                      <td className="text-center p-1 border-r border-gray-200">{emoji}</td>
                      <td className="text-center p-1 border-r border-gray-200 font-medium">
                        {(() => {
                          const pct = baselineAcc * 100;
                          return Number.isInteger(pct) ? `${pct}` : pct.toFixed(2);
                        })()}
                      </td>
                      {maskRates.map(mask => {
                        const accuracy = getAccuracy(model.runId, mask, false);
                        const diff = accuracy !== undefined ? accuracy - baselineAcc : 0;
                        return (
                          <td key={`mask-${mask}`} className={`text-center p-1 border-r border-gray-100 last:border-r-gray-200 ${getDiffBgColor(diff)} text-white font-medium`}>
                            {accuracy !== undefined ? `${(accuracy * 100).toFixed(0)}` : '-'}
                          </td>
                        );
                      })}
                      {imputeRates.map(mask => {
                        const accuracy = getAccuracy(model.runId, mask, true);
                        const baseAcc = getAccuracy(model.runId, mask, false) || baselineAcc;
                        const diff = accuracy !== undefined ? accuracy - baseAcc : 0;
                        return (
                          <td key={`impute-${mask}`} className={`text-center p-1 border-r border-gray-100 last:border-r-0 ${getDiffBgColor(diff)} text-white font-medium`}>
                            {accuracy !== undefined ? `${(accuracy * 100).toFixed(0)}` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2 px-2">
              Mask: accuracy vs baseline (0% mask). Impute: accuracy vs same mask rate without imputation.
            </p>
          </div>
        </Card>

        {/* Show images below for sequence mode */}
        {result.compareId && <div className="mt-6"><ImagesDisplay compareId={result.compareId} /></div>}
      </>
    );
  }

  // Standard mode: compute sorted models for display
  const sortedModels = (() => {
    if (!result.models) return [];
    if (sortBy === 'default') return result.models;
    if (sortBy === 'compare-score') {
      return [...result.models].sort((a, b) => b.compareAccuracy - a.compareAccuracy);
    }
    // model-score: group by model type, sorted by best performance
    const bestByModel = new Map<string, number>();
    for (const m of result.models) {
      const current = bestByModel.get(m.model) ?? -1;
      if (m.compareAccuracy > current) {
        bestByModel.set(m.model, m.compareAccuracy);
      }
    }
    return [...result.models].sort((a, b) => {
      const aBest = bestByModel.get(a.model) ?? 0;
      const bBest = bestByModel.get(b.model) ?? 0;
      if (aBest !== bBest) return bBest - aBest;
      if (a.model !== b.model) return a.model.localeCompare(b.model);
      return b.compareAccuracy - a.compareAccuracy;
    });
  })();

  // Standard mode: show individual model accuracy cards
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {onLoadModels && (
              <button
                type="button"
                onClick={onLoadModels}
                title="Load models into compare"
                className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <SaveIcon />
              </button>
            )}
            <CardTitle>Comparison Results</CardTitle>
          </div>
          <div className="flex gap-1">
            <SortIconButton
              active={sortBy === 'default'}
              onClick={() => setSortBy('default')}
              title="Default order"
            >
              <ListIcon />
            </SortIconButton>
            <SortIconButton
              active={sortBy === 'compare-score'}
              onClick={() => setSortBy('compare-score')}
              title="Sort by compare score"
            >
              <SortDescIcon />
            </SortIconButton>
            <SortIconButton
              active={sortBy === 'model-score'}
              onClick={() => setSortBy('model-score')}
              title="Group by model type"
            >
              <GridIcon />
            </SortIconButton>
          </div>
        </div>
      </CardHeader>

      <div className="space-y-3">
        {sortedModels.map((model) => (
          <ModelAccuracyCard
            key={model.runId}
            model={model}
            onAddModel={onAddModel}
            showAddIcon={!!onAddModel}
          />
        ))}
      </div>
    </Card>
  );
}
