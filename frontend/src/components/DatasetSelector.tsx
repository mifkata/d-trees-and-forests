'use client';

import { Select } from './ui';
import { DATASETS } from '@/types/dataset';
import type { DatasetId } from '@/types/dataset';

interface DatasetSelectorProps {
  value: DatasetId;
  onChange: (value: DatasetId) => void;
  disabled?: boolean;
}

export function DatasetSelector({ value, onChange, disabled }: DatasetSelectorProps) {
  const options = Object.values(DATASETS).map((dataset) => ({
    value: dataset.id,
    label: dataset.name,
  }));

  return (
    <Select
      label="Dataset"
      value={value}
      onChange={(v) => onChange(v as DatasetId)}
      options={options}
      disabled={disabled}
    />
  );
}
