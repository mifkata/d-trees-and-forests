'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Select, Modal } from './ui';
import { MODELS } from '@/types/model';
import type { ModelId } from '@/types/model';
import type { DatasetId } from '@/types/dataset';

interface HistoryRun {
  runId: string;
  model: string;
  dataset: string;
  accuracy: number;
  timestamp: number;
  name?: string;
}

interface ModelSelectorProps {
  value: ModelId;
  onChange: (value: ModelId) => void;
  dataset: DatasetId;
  disabled?: boolean;
}

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function ModelSelector({ value, onChange, dataset, disabled }: ModelSelectorProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const options = Object.values(MODELS).map((model) => ({
    value: model.id,
    label: model.name,
  }));

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/history?model=${value}&dataset=${dataset}`);
      const data = await res.json();
      setHistory(data.runs || []);
    } catch {
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [value, dataset]);

  useEffect(() => {
    if (isHistoryOpen) {
      fetchHistory();
    }
  }, [isHistoryOpen, fetchHistory]);

  const handleRunClick = (runId: string) => {
    setIsHistoryOpen(false);
    router.push(`/?run_id=${runId}`);
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          disabled={disabled}
          className="absolute top-0 right-0 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          History
        </button>
        <Select
          label="Model"
          value={value}
          onChange={(v) => onChange(v as ModelId)}
          options={options}
          disabled={disabled}
        />
      </div>

      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`${MODELS[value].name} History - ${dataset}`}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No history found
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((run) => {
              const accuracyColor = run.accuracy >= 0.9
                ? 'text-green-600'
                : run.accuracy >= 0.8
                  ? 'text-yellow-500'
                  : run.accuracy >= 0.7
                    ? 'text-orange-500'
                    : run.accuracy >= 0.5
                      ? 'text-red-600'
                      : 'text-blue-900';
              return (
                <button
                  key={run.runId}
                  onClick={() => handleRunClick(run.runId)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <span className="font-mono text-sm text-gray-700">
                    {run.name ? run.name.replace(/_/g, " ") : run.runId}
                  </span>
                  <span className={`font-semibold ${accuracyColor}`}>{(run.accuracy * 100).toFixed(2)}%</span>
                  <span className="text-sm text-gray-400">{formatTimeAgo(run.timestamp)}</span>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
