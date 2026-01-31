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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
      setDeleteConfirmId(null);
    }
  }, [isHistoryOpen, fetchHistory]);

  const handleRunClick = (runId: string) => {
    setIsHistoryOpen(false);
    router.push(`/?run_id=${runId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, run: HistoryRun) => {
    e.stopPropagation();

    // If run has a name, show confirmation
    if (run.name) {
      setDeleteConfirmId(run.runId);
    } else {
      // No name - delete immediately
      performDelete(run.runId);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const handleConfirmDelete = (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    performDelete(runId);
  };

  const performDelete = async (runId: string) => {
    setDeletingId(runId);
    setDeleteConfirmId(null);

    // Optimistic update - remove from UI immediately
    const previousHistory = [...history];
    setHistory(history.filter(run => run.runId !== runId));

    try {
      const res = await fetch(`/api/history/${runId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!data.success) {
        // Restore on failure
        setHistory(previousHistory);
      }
    } catch {
      // Restore on error
      setHistory(previousHistory);
    } finally {
      setDeletingId(null);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.8) return 'text-yellow-500';
    if (accuracy >= 0.7) return 'text-orange-500';
    if (accuracy >= 0.5) return 'text-red-600';
    return 'text-blue-900';
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
        maxWidth="lg"
        fitContent
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-medium text-gray-500">
                <th className="text-left px-3 py-2 font-medium">Name/ID</th>
                <th className="text-right px-3 py-2 font-medium w-[70px]">Accuracy</th>
                <th className="text-right px-3 py-2 font-medium w-[90px]">Time</th>
                <th className="text-center px-1 py-2 font-medium w-[44px]"><span className="sr-only">Delete</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((run) => {
                const isConfirming = deleteConfirmId === run.runId;
                const isDeleting = deletingId === run.runId;

                return (
                  <tr
                    key={run.runId}
                    onClick={() => !isConfirming && handleRunClick(run.runId)}
                    className={`transition-colors ${
                      isConfirming ? 'bg-red-50' : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    {/* Name/ID Column */}
                    <td className="px-3 py-2 font-mono text-sm text-gray-700 whitespace-nowrap">
                      {run.name ? run.name.replace(/_/g, " ") : run.runId}
                    </td>

                    {/* Accuracy Column */}
                    <td className={`px-3 py-2 text-right font-semibold ${getAccuracyColor(run.accuracy)}`}>
                      {(run.accuracy * 100).toFixed(2)}%
                    </td>

                    {isConfirming ? (
                      /* Confirmation UI - spans Time and Delete columns */
                      <td colSpan={2} className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-red-600">Delete?</span>
                          <button
                            type="button"
                            onClick={handleCancelDelete}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleConfirmDelete(e, run.runId)}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Confirm
                          </button>
                        </div>
                      </td>
                    ) : (
                      <>
                        {/* Time Column */}
                        <td className="px-3 py-2 text-right text-sm text-gray-400 whitespace-nowrap">
                          {formatTimeAgo(run.timestamp)}
                        </td>

                        {/* Delete Column */}
                        <td className="px-1 py-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(e, run)}
                            disabled={isDeleting}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete run"
                          >
                            {isDeleting ? (
                              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Modal>
    </>
  );
}
