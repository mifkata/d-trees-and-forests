'use client';

import { Select, Input, Checkbox, Button } from './ui';
import type { ModelId } from '@/types/model';
import type { TreeParams, ForestParams, GradientParams, ModelParams as ModelParamsType } from '@/types/params';
import { MODELS } from '@/types/model';

interface ModelParamsProps {
  model: ModelId;
  params: ModelParamsType;
  onChange: (params: Partial<ModelParamsType>) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function ModelParams({ model, params, onChange, onReset, disabled }: ModelParamsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">
          Model Parameters ({MODELS[model].name})
        </h3>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={disabled}>
          Reset to Defaults
        </Button>
      </div>

      {model === 'tree' && (
        <TreeParamsForm params={params as TreeParams} onChange={onChange} disabled={disabled} />
      )}
      {model === 'forest' && (
        <ForestParamsForm params={params as ForestParams} onChange={onChange} disabled={disabled} />
      )}
      {model === 'gradient' && (
        <GradientParamsForm params={params as GradientParams} onChange={onChange} disabled={disabled} />
      )}
    </div>
  );
}

interface TreeParamsFormProps {
  params: TreeParams;
  onChange: (params: Partial<TreeParams>) => void;
  disabled?: boolean;
}

function TreeParamsForm({ params, onChange, disabled }: TreeParamsFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Select
        label="Criterion"
        value={params.criterion}
        onChange={(v) => onChange({ criterion: v as TreeParams['criterion'] })}
        options={[
          { value: 'gini', label: 'Gini' },
          { value: 'entropy', label: 'Entropy' },
          { value: 'log_loss', label: 'Log Loss' },
        ]}
        disabled={disabled}
      />

      <Select
        label="Splitter"
        value={params.splitter}
        onChange={(v) => onChange({ splitter: v as TreeParams['splitter'] })}
        options={[
          { value: 'best', label: 'Best' },
          { value: 'random', label: 'Random' },
        ]}
        disabled={disabled}
      />

      <Input
        label="Max Depth"
        type="number"
        value={params.max_depth ?? ''}
        onChange={(v) => onChange({ max_depth: v === '' ? null : Number(v) })}
        placeholder="Unlimited"
        min={1}
        disabled={disabled}
      />

      <Input
        label="Min Samples Split"
        type="number"
        value={params.min_samples_split}
        onChange={(v) => onChange({ min_samples_split: Number(v) || 2 })}
        min={2}
        disabled={disabled}
      />

      <Input
        label="Min Samples Leaf"
        type="number"
        value={params.min_samples_leaf}
        onChange={(v) => onChange({ min_samples_leaf: Number(v) || 1 })}
        min={1}
        disabled={disabled}
      />

      <Select
        label="Max Features"
        value={params.max_features ?? 'auto'}
        onChange={(v) => onChange({ max_features: v === 'auto' ? null : v as 'sqrt' | 'log2' })}
        options={[
          { value: 'auto', label: 'Auto (all)' },
          { value: 'sqrt', label: 'Square Root' },
          { value: 'log2', label: 'Log2' },
        ]}
        disabled={disabled}
      />
    </div>
  );
}

interface ForestParamsFormProps {
  params: ForestParams;
  onChange: (params: Partial<ForestParams>) => void;
  disabled?: boolean;
}

function ForestParamsForm({ params, onChange, disabled }: ForestParamsFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="N Estimators"
          type="number"
          value={params.n_estimators}
          onChange={(v) => onChange({ n_estimators: Number(v) || 10 })}
          min={1}
          disabled={disabled}
        />

        <Select
          label="Criterion"
          value={params.criterion}
          onChange={(v) => onChange({ criterion: v as ForestParams['criterion'] })}
          options={[
            { value: 'gini', label: 'Gini' },
            { value: 'entropy', label: 'Entropy' },
            { value: 'log_loss', label: 'Log Loss' },
          ]}
          disabled={disabled}
        />

        <Input
          label="Max Depth"
          type="number"
          value={params.max_depth ?? ''}
          onChange={(v) => onChange({ max_depth: v === '' ? null : Number(v) })}
          placeholder="Unlimited"
          min={1}
          disabled={disabled}
        />

        <Input
          label="Min Samples Split"
          type="number"
          value={params.min_samples_split}
          onChange={(v) => onChange({ min_samples_split: Number(v) || 2 })}
          min={2}
          disabled={disabled}
        />

        <Input
          label="Min Samples Leaf"
          type="number"
          value={params.min_samples_leaf}
          onChange={(v) => onChange({ min_samples_leaf: Number(v) || 1 })}
          min={1}
          disabled={disabled}
        />

        <Select
          label="Max Features"
          value={params.max_features ?? 'auto'}
          onChange={(v) => onChange({ max_features: v === 'auto' ? null : v as 'sqrt' | 'log2' })}
          options={[
            { value: 'auto', label: 'Auto (all)' },
            { value: 'sqrt', label: 'Square Root' },
            { value: 'log2', label: 'Log2' },
          ]}
          disabled={disabled}
        />

        <Input
          label="Max Samples"
          type="number"
          value={params.max_samples ?? ''}
          onChange={(v) => onChange({ max_samples: v === '' ? null : Number(v) })}
          placeholder="All"
          min={1}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <Checkbox
          label="Bootstrap"
          checked={params.bootstrap}
          onChange={(bootstrap) => onChange({ bootstrap })}
          disabled={disabled}
        />
        <Checkbox
          label="OOB Score"
          checked={params.oob_score}
          onChange={(oob_score) => onChange({ oob_score })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

interface GradientParamsFormProps {
  params: GradientParams;
  onChange: (params: Partial<GradientParams>) => void;
  disabled?: boolean;
}

function GradientParamsForm({ params, onChange, disabled }: GradientParamsFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Input
        label="Learning Rate"
        type="number"
        value={params.learning_rate}
        onChange={(v) => onChange({ learning_rate: Number(v) || 0.1 })}
        min={0.01}
        max={1}
        step={0.01}
        disabled={disabled}
      />

      <Input
        label="Max Iterations"
        type="number"
        value={params.max_iter}
        onChange={(v) => onChange({ max_iter: Number(v) || 100 })}
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Depth"
        type="number"
        value={params.max_depth ?? ''}
        onChange={(v) => onChange({ max_depth: v === '' ? null : Number(v) })}
        placeholder="Unlimited"
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Leaf Nodes"
        type="number"
        value={params.max_leaf_nodes ?? ''}
        onChange={(v) => onChange({ max_leaf_nodes: v === '' ? null : Number(v) })}
        placeholder="Unlimited"
        min={2}
        disabled={disabled}
      />

      <Input
        label="Min Samples Leaf"
        type="number"
        value={params.min_samples_leaf}
        onChange={(v) => onChange({ min_samples_leaf: Number(v) || 1 })}
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Bins"
        type="number"
        value={params.max_bins}
        onChange={(v) => onChange({ max_bins: Number(v) || 255 })}
        min={2}
        max={255}
        disabled={disabled}
      />

      <Select
        label="Early Stopping"
        value={String(params.early_stopping)}
        onChange={(v) => {
          const value = v === 'auto' ? 'auto' : v === 'true';
          onChange({ early_stopping: value });
        }}
        options={[
          { value: 'false', label: 'Off' },
          { value: 'true', label: 'On' },
          { value: 'auto', label: 'Auto' },
        ]}
        disabled={disabled}
      />
    </div>
  );
}
