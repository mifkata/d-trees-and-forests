'use client';

import { Card, CardHeader, CardTitle, Slider, Checkbox, Button } from './ui';
import type { DatasetParams as DatasetParamsType } from '@/types/params';

interface DatasetParamsProps {
  params: DatasetParamsType;
  onChange: (params: Partial<DatasetParamsType>) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function DatasetParams({ params, onChange, onReset, disabled }: DatasetParamsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Parameters</CardTitle>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={disabled}>
          Reset
        </Button>
      </CardHeader>

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
        />

        <div className="flex flex-wrap gap-4">
          <Checkbox
            label="Impute missing values"
            checked={params.impute}
            onChange={(impute) => onChange({ impute })}
            disabled={disabled}
          />
          <Checkbox
            label="Generate images"
            checked={params.images}
            onChange={(images) => onChange({ images })}
            disabled={disabled}
          />
          <Checkbox
            label="Use cached dataset"
            checked={params.useOutput}
            onChange={(useOutput) => onChange({ useOutput })}
            disabled={disabled}
          />
        </div>
      </div>
    </Card>
  );
}
