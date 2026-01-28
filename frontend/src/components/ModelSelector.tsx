'use client';

import { Select } from './ui';
import { MODELS } from '@/types/model';
import type { ModelId } from '@/types/model';

interface ModelSelectorProps {
  value: ModelId;
  onChange: (value: ModelId) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const options = Object.values(MODELS).map((model) => ({
    value: model.id,
    label: model.name,
  }));

  return (
    <Select
      label="Model"
      value={value}
      onChange={(v) => onChange(v as ModelId)}
      options={options}
      disabled={disabled}
    />
  );
}
