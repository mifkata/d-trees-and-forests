'use client';

import { Card, CardHeader, CardTitle, Select, Input, Checkbox, Button } from './ui';
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
    <Card>
      <CardHeader>
        <CardTitle>Model Parameters ({MODELS[model].name})</CardTitle>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={disabled}>
          Reset to Defaults
        </Button>
      </CardHeader>

      {model === 'tree' && (
        <TreeParamsForm params={params as TreeParams} onChange={onChange} disabled={disabled} />
      )}
      {model === 'forest' && (
        <ForestParamsForm params={params as ForestParams} onChange={onChange} disabled={disabled} />
      )}
      {model === 'gradient' && (
        <GradientParamsForm params={params as GradientParams} onChange={onChange} disabled={disabled} />
      )}
    </Card>
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
        value={params.maxDepth ?? ''}
        onChange={(v) => onChange({ maxDepth: v === '' ? null : Number(v) })}
        placeholder="Unlimited"
        min={1}
        disabled={disabled}
      />

      <Input
        label="Min Samples Split"
        type="number"
        value={params.minSamplesSplit}
        onChange={(v) => onChange({ minSamplesSplit: Number(v) || 2 })}
        min={2}
        disabled={disabled}
      />

      <Input
        label="Min Samples Leaf"
        type="number"
        value={params.minSamplesLeaf}
        onChange={(v) => onChange({ minSamplesLeaf: Number(v) || 1 })}
        min={1}
        disabled={disabled}
      />

      <Select
        label="Max Features"
        value={params.maxFeatures ?? 'auto'}
        onChange={(v) => onChange({ maxFeatures: v === 'auto' ? null : v as 'sqrt' | 'log2' })}
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
          value={params.nEstimators}
          onChange={(v) => onChange({ nEstimators: Number(v) || 10 })}
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
          value={params.maxDepth ?? ''}
          onChange={(v) => onChange({ maxDepth: v === '' ? null : Number(v) })}
          placeholder="Unlimited"
          min={1}
          disabled={disabled}
        />

        <Input
          label="Min Samples Split"
          type="number"
          value={params.minSamplesSplit}
          onChange={(v) => onChange({ minSamplesSplit: Number(v) || 2 })}
          min={2}
          disabled={disabled}
        />

        <Input
          label="Min Samples Leaf"
          type="number"
          value={params.minSamplesLeaf}
          onChange={(v) => onChange({ minSamplesLeaf: Number(v) || 1 })}
          min={1}
          disabled={disabled}
        />

        <Select
          label="Max Features"
          value={params.maxFeatures ?? 'auto'}
          onChange={(v) => onChange({ maxFeatures: v === 'auto' ? null : v as 'sqrt' | 'log2' })}
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
          value={params.maxSamples ?? ''}
          onChange={(v) => onChange({ maxSamples: v === '' ? null : Number(v) })}
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
          checked={params.oobScore}
          onChange={(oobScore) => onChange({ oobScore })}
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
        value={params.learningRate}
        onChange={(v) => onChange({ learningRate: Number(v) || 0.1 })}
        min={0.01}
        max={1}
        step={0.01}
        disabled={disabled}
      />

      <Input
        label="Max Iterations"
        type="number"
        value={params.maxIter}
        onChange={(v) => onChange({ maxIter: Number(v) || 100 })}
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Depth"
        type="number"
        value={params.maxDepth ?? ''}
        onChange={(v) => onChange({ maxDepth: v === '' ? null : Number(v) })}
        placeholder="Unlimited"
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Leaf Nodes"
        type="number"
        value={params.maxLeafNodes ?? ''}
        onChange={(v) => onChange({ maxLeafNodes: v === '' ? null : Number(v) })}
        placeholder="Unlimited"
        min={2}
        disabled={disabled}
      />

      <Input
        label="Min Samples Leaf"
        type="number"
        value={params.minSamplesLeaf}
        onChange={(v) => onChange({ minSamplesLeaf: Number(v) || 1 })}
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Bins"
        type="number"
        value={params.maxBins}
        onChange={(v) => onChange({ maxBins: Number(v) || 255 })}
        min={2}
        max={255}
        disabled={disabled}
      />

      <Select
        label="Early Stopping"
        value={String(params.earlyStopping)}
        onChange={(v) => {
          const value = v === 'auto' ? 'auto' : v === 'true';
          onChange({ earlyStopping: value });
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
