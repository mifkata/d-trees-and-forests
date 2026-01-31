'use client';

import { Slider, Checkbox, Button, ImputeCheckbox } from './ui';
import type { DatasetParams as DatasetParamsType } from '@/types/params';
import type { DatasetId } from '@/types/dataset';
import { DATASETS } from '@/types/dataset';

interface DatasetParamsProps {
  params: DatasetParamsType;
  dataset: DatasetId;
  onChange: (params: Partial<DatasetParamsType>) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function DatasetParams({ params, dataset, onChange, onReset, disabled }: DatasetParamsProps) {
  const columns = DATASETS[dataset].features;

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
        <Button variant="ghost" size="sm" onClick={onReset} disabled={disabled}>
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
            <Checkbox
              label="Select All"
              checked={allSelected}
              onChange={handleSelectAll}
              disabled={disabled}
            />
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
