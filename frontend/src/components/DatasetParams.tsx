'use client';

import { Slider, Checkbox, Button, ImputeCheckbox } from './ui';
import type { DatasetParams as DatasetParamsType } from '@/types/params';
import type { DatasetId } from '@/types/dataset';
import { DATASETS } from '@/types/dataset';

interface ColumnClipboard {
  dataset: DatasetId;
  ignore_columns: number[];
}

interface DatasetParamsProps {
  params: DatasetParamsType;
  dataset: DatasetId;
  onChange: (params: Partial<DatasetParamsType>) => void;
  onReset: () => void;
  disabled?: boolean;
  clipboard?: ColumnClipboard | null;
  onCopy?: (clipboard: ColumnClipboard) => void;
  onPaste?: (ignore_columns: number[]) => void;
}

export function DatasetParams({ params, dataset, onChange, onReset, disabled, clipboard, onCopy, onPaste }: DatasetParamsProps) {
  const columns = DATASETS[dataset].features;

  // Check if paste is available (clipboard has selection for same dataset)
  const canPaste = clipboard != null && clipboard.dataset === dataset;

  const handleCopy = () => {
    if (onCopy) {
      onCopy({
        dataset,
        ignore_columns: params.ignore_columns || [],
      });
    }
  };

  const handlePaste = () => {
    if (onPaste && clipboard && clipboard.dataset === dataset) {
      onPaste(clipboard.ignore_columns);
    }
  };

  const handleColumnToggle = (index: number) => {
    const ignore_columns = params.ignore_columns || [];
    if (ignore_columns.includes(index)) {
      onChange({ ignore_columns: ignore_columns.filter(i => i !== index) });
    } else {
      onChange({ ignore_columns: [...ignore_columns, index] });
    }
  };

  const allSelected = !params.ignore_columns || params.ignore_columns.length === 0;

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all - add all column indices to ignore_columns
      onChange({ ignore_columns: columns.map((_, i) => i) });
    } else {
      // Select all - clear ignore_columns
      onChange({ ignore_columns: [] });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Dataset Parameters</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={disabled}>
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        <Slider
          label="Mask Rate"
          value={params.mask}
          onChange={(mask) => onChange({ mask })}
          min={0}
          max={100}
          step={5}
          unit="%"
          disabled={disabled}
          action={
            <ImputeCheckbox
              mask={params.mask}
              impute={params.impute}
              onChange={(impute) => onChange({ impute })}
              disabled={disabled}
            />
          }
        />

        <Slider
          label="Test Split"
          value={params.split}
          onChange={(split) => onChange({ split })}
          min={10}
          max={90}
          step={5}
          unit="%"
          disabled={disabled}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Feature Columns
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={disabled}
                className="flex items-center gap-1 text-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </Button>
              {canPaste && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePaste}
                  disabled={disabled}
                  className="flex items-center gap-1 text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Paste
                </Button>
              )}
              <Checkbox
                label="Select All"
                checked={allSelected}
                onChange={handleSelectAll}
                disabled={disabled}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {columns.map((col, index) => (
              <Checkbox
                key={col}
                label={col}
                checked={!params.ignore_columns?.includes(index)}
                onChange={() => handleColumnToggle(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
