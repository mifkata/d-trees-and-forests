'use client';

import { useState } from 'react';
import { Modal, Spinner } from './ui';
import type { CompareHistoryRun } from '@/hooks/useCompare';

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

function formatModelName(model: { runId: string; name: string | null }): string {
  if (model.name) {
    return model.name.replace(/_/g, ' ');
  }
  return model.runId;
}

const MODEL_LABELS: Record<string, string> = {
  'tree': 'Tree',
  'forest': 'Forest',
  'gradient': 'Gradient',
  'hist-gradient': 'Hist Gradient',
};

interface CompareHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  runs: CompareHistoryRun[];
  isLoading: boolean;
  onSelect: (compareId: string) => void;
  onDelete: (compareId: string) => Promise<boolean>;
  onRefresh: () => void;
}

export function CompareHistoryModal({
  isOpen,
  onClose,
  runs,
  isLoading,
  onSelect,
  onDelete,
  onRefresh,
}: CompareHistoryModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, compareId: string) => {
    e.stopPropagation();
    setDeletingId(compareId);
    const success = await onDelete(compareId);
    if (success) {
      onRefresh();
    }
    setDeletingId(null);
  };

  const handleSelect = (compareId: string) => {
    onSelect(compareId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare History" maxWidth="4xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-6 w-6" />
          <span className="ml-3 text-gray-500">Loading history...</span>
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No compare history found for this dataset.</p>
          <p className="text-sm mt-2">Run a comparison to create history.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div
              key={run.compareId}
              onClick={() => handleSelect(run.compareId)}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header: Name/ID and timestamp */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">
                      {run.name ? run.name.replace(/_/g, ' ') : run.compareId}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatTimeAgo(run.timestamp)}
                    </span>
                    {run.mask > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                        mask: {run.mask}%
                      </span>
                    )}
                    {run.impute && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        imputed
                      </span>
                    )}
                  </div>

                  {/* Model list - dynamic based on array */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {run.models.map((model, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-gray-500 w-28">
                          {MODEL_LABELS[model.model] || model.model}:
                        </span>
                        <span className="text-gray-700 truncate">
                          {formatModelName(model)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, run.compareId)}
                  disabled={deletingId === run.compareId}
                  className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete compare run"
                >
                  {deletingId === run.compareId ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
