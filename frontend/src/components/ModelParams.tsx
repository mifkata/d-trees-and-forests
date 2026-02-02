"use client";

import { Select, Input, Checkbox, Button } from "./ui";
import type { ModelId } from "@/types/model";
import type {
  TreeParams,
  ForestParams,
  GradientParams,
  HistGradientParams,
  ModelParams as ModelParamsType,
} from "@/types/params";
import { MODELS } from "@/types/model";

interface ModelParamsProps {
  model: ModelId;
  params: ModelParamsType;
  onChange: (params: Partial<ModelParamsType>) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function ModelParams({
  model,
  params,
  onChange,
  onReset,
  disabled,
}: ModelParamsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">
          Model Parameters ({MODELS[model].name})
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={disabled}
        >
          Reset
        </Button>
      </div>

      {model === "tree" && (
        <TreeParamsForm
          params={params as TreeParams}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {model === "forest" && (
        <ForestParamsForm
          params={params as ForestParams}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {model === "gradient" && (
        <GradientParamsForm
          params={params as GradientParams}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {model === "hist-gradient" && (
        <HistGradientParamsForm
          params={params as HistGradientParams}
          onChange={onChange}
          disabled={disabled}
        />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Select
        label="Criterion"
        tooltip="Function to measure split quality. Gini is faster, entropy may give slightly better results."
        value={params.criterion}
        onChange={(v) => onChange({ criterion: v as TreeParams["criterion"] })}
        options={[
          { value: "gini", label: "Gini" },
          { value: "entropy", label: "Entropy" },
          { value: "log_loss", label: "Log Loss" },
        ]}
        disabled={disabled}
      />

      <Select
        label="Splitter"
        tooltip="Strategy to choose the split. Best chooses optimal split, random is faster but less accurate."
        value={params.splitter}
        onChange={(v) => onChange({ splitter: v as TreeParams["splitter"] })}
        options={[
          { value: "best", label: "Best" },
          { value: "random", label: "Random" },
        ]}
        disabled={disabled}
      />

      <Select
        label="Max Features"
        tooltip="Number of features to consider for best split. Fewer features = faster but potentially less accurate."
        value={params.max_features ?? "auto"}
        onChange={(v) =>
          onChange({
            max_features: v === "auto" ? null : (v as "sqrt" | "log2"),
          })
        }
        options={[
          { value: "auto", label: "Auto (all)" },
          { value: "sqrt", label: "Square Root" },
          { value: "log2", label: "Log2" },
        ]}
        disabled={disabled}
      />

      <Input
        label="Max Depth"
        tooltip="Maximum depth of tree. Deeper trees can overfit. Leave empty for unlimited."
        type="number"
        value={params.max_depth ?? ""}
        onChange={(v) => onChange({ max_depth: v === "" ? null : Number(v) })}
        placeholder="Unlimited"
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Leaf Nodes"
        tooltip="Maximum number of leaf nodes. Limits tree complexity. Leave empty for unlimited."
        type="number"
        value={params.max_leaf_nodes ?? ""}
        onChange={(v) =>
          onChange({ max_leaf_nodes: v === "" ? null : Number(v) })
        }
        placeholder="Unlimited"
        min={2}
        disabled={disabled}
      />

      <Input
        label="Min Samples Split"
        tooltip="Minimum samples required to split a node. Higher values prevent overfitting."
        type="number"
        value={params.min_samples_split}
        onChange={(v) => onChange({ min_samples_split: Number(v) || 2 })}
        min={2}
        disabled={disabled}
      />

      <Input
        label="Min Samples Leaf"
        tooltip="Minimum samples required at a leaf node. Higher values create smoother models."
        type="number"
        value={params.min_samples_leaf}
        onChange={(v) => onChange({ min_samples_leaf: Number(v) || 1 })}
        min={1}
        disabled={disabled}
      />

      <Input
        label="Min Impurity Decrease"
        tooltip="Minimum impurity decrease required for a split. Acts as early stopping criterion."
        type="number"
        value={params.min_impurity_decrease}
        onChange={(v) => onChange({ min_impurity_decrease: Number(v) || 0 })}
        min={0}
        step={0.01}
        disabled={disabled}
      />

      <Input
        label="CCP Alpha"
        tooltip="Complexity parameter for cost-complexity pruning. Higher values create simpler trees."
        type="number"
        value={params.ccp_alpha}
        onChange={(v) => onChange({ ccp_alpha: Number(v) || 0 })}
        min={0}
        step={0.01}
        disabled={disabled}
      />

      <Select
        label="Class Weight"
        tooltip="Weight classes inversely proportional to frequency. Useful for imbalanced datasets."
        value={params.class_weight ?? "none"}
        onChange={(v) =>
          onChange({ class_weight: v === "none" ? null : (v as "balanced") })
        }
        options={[
          { value: "none", label: "None" },
          { value: "balanced", label: "Balanced" },
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

function ForestParamsForm({
  params,
  onChange,
  disabled,
}: ForestParamsFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="N Estimators"
          tooltip="Number of trees in the forest. More trees = better accuracy but slower training."
          type="number"
          value={params.n_estimators}
          onChange={(v) => onChange({ n_estimators: Number(v) || 10 })}
          min={1}
          disabled={disabled}
        />

        <Select
          label="Criterion"
          tooltip="Function to measure split quality. Gini is faster, entropy may give slightly better results."
          value={params.criterion}
          onChange={(v) =>
            onChange({ criterion: v as ForestParams["criterion"] })
          }
          options={[
            { value: "gini", label: "Gini" },
            { value: "entropy", label: "Entropy" },
            { value: "log_loss", label: "Log Loss" },
          ]}
          disabled={disabled}
        />

        <Select
          label="Max Features"
          tooltip="Features to consider per split. sqrt is recommended for classification."
          value={params.max_features ?? "auto"}
          onChange={(v) =>
            onChange({
              max_features: v === "auto" ? null : (v as "sqrt" | "log2"),
            })
          }
          options={[
            { value: "auto", label: "Auto (all)" },
            { value: "sqrt", label: "Square Root" },
            { value: "log2", label: "Log2" },
          ]}
          disabled={disabled}
        />

        <Input
          label="Max Depth"
          tooltip="Maximum depth of each tree. Shallower trees prevent overfitting."
          type="number"
          value={params.max_depth ?? ""}
          onChange={(v) => onChange({ max_depth: v === "" ? null : Number(v) })}
          placeholder="Unlimited"
          min={1}
          disabled={disabled}
        />

        <Input
          label="Max Leaf Nodes"
          tooltip="Maximum leaf nodes per tree. Limits complexity."
          type="number"
          value={params.max_leaf_nodes ?? ""}
          onChange={(v) =>
            onChange({ max_leaf_nodes: v === "" ? null : Number(v) })
          }
          placeholder="Unlimited"
          min={2}
          disabled={disabled}
        />

        <Input
          label="Max Samples"
          tooltip="Samples to draw for training each tree. Lower values increase diversity."
          type="number"
          value={params.max_samples ?? ""}
          onChange={(v) =>
            onChange({ max_samples: v === "" ? null : Number(v) })
          }
          placeholder="All"
          min={1}
          disabled={disabled}
        />

        <Input
          label="Min Samples Split"
          tooltip="Minimum samples to split a node. Higher = less overfitting."
          type="number"
          value={params.min_samples_split}
          onChange={(v) => onChange({ min_samples_split: Number(v) || 2 })}
          min={2}
          disabled={disabled}
        />

        <Input
          label="Min Samples Leaf"
          tooltip="Minimum samples at leaf nodes. Higher = smoother predictions."
          type="number"
          value={params.min_samples_leaf}
          onChange={(v) => onChange({ min_samples_leaf: Number(v) || 1 })}
          min={1}
          disabled={disabled}
        />

        <Input
          label="Min Impurity Decrease"
          tooltip="Minimum impurity decrease for a split. Acts as regularization."
          type="number"
          value={params.min_impurity_decrease}
          onChange={(v) => onChange({ min_impurity_decrease: Number(v) || 0 })}
          min={0}
          step={0.01}
          disabled={disabled}
        />

        <Input
          label="CCP Alpha"
          tooltip="Cost-complexity pruning parameter. Higher = simpler trees."
          type="number"
          value={params.ccp_alpha}
          onChange={(v) => onChange({ ccp_alpha: Number(v) || 0 })}
          min={0}
          step={0.01}
          disabled={disabled}
        />

        <Input
          label="N Jobs"
          tooltip="Parallel jobs for fitting. -1 uses all CPU cores."
          type="number"
          value={params.n_jobs ?? ""}
          onChange={(v) => onChange({ n_jobs: v === "" ? null : Number(v) })}
          placeholder="1 (-1 for all)"
          min={-1}
          disabled={disabled}
        />

        <Select
          label="Class Weight"
          tooltip="Weight classes inversely proportional to frequency. balanced_subsample uses bootstrap sample weights."
          value={params.class_weight ?? "none"}
          onChange={(v) =>
            onChange({
              class_weight:
                v === "none" ? null : (v as "balanced" | "balanced_subsample"),
            })
          }
          options={[
            { value: "none", label: "None" },
            { value: "balanced", label: "Balanced" },
            { value: "balanced_subsample", label: "Balanced Subsample" },
          ]}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <Checkbox
          label="Bootstrap"
          tooltip="Whether to use bootstrap samples. Enables out-of-bag scoring."
          checked={params.bootstrap}
          onChange={(bootstrap) => onChange({ bootstrap })}
          disabled={disabled}
        />
        <Checkbox
          label="OOB Score"
          tooltip="Use out-of-bag samples to estimate generalization score."
          checked={params.oob_score}
          onChange={(oob_score) => onChange({ oob_score })}
          disabled={disabled || !params.bootstrap}
        />
        <Checkbox
          label="Warm Start"
          tooltip="Reuse previous fit and add more estimators."
          checked={params.warm_start}
          onChange={(warm_start) => onChange({ warm_start })}
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

function GradientParamsForm({
  params,
  onChange,
  disabled,
}: GradientParamsFormProps) {
  const earlyStoppingEnabled = params.n_iter_no_change !== null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Select
        label="Loss"
        tooltip="Loss function. log_loss for multi-class, exponential for AdaBoost-like algorithm (binary only)."
        value={params.loss}
        onChange={(v) => onChange({ loss: v as GradientParams["loss"] })}
        options={[
          { value: "log_loss", label: "Log Loss" },
          { value: "exponential", label: "Exponential" },
        ]}
        disabled={disabled}
      />

      <Input
        label="Learning Rate"
        tooltip="Shrinkage factor. Lower values require more estimators but often give better results."
        type="number"
        value={params.learning_rate}
        onChange={(v) => onChange({ learning_rate: Number(v) || 0.1 })}
        min={0.01}
        max={1}
        step={0.01}
        disabled={disabled}
      />

      <Input
        label="N Estimators"
        tooltip="Number of boosting stages. More stages can improve accuracy but increase training time."
        type="number"
        value={params.n_estimators}
        onChange={(v) => onChange({ n_estimators: Number(v) || 100 })}
        min={1}
        disabled={disabled}
      />

      <Input
        label="Subsample"
        tooltip="Fraction of samples for fitting each base learner. Values < 1.0 enable stochastic gradient boosting."
        type="number"
        value={params.subsample}
        onChange={(v) => onChange({ subsample: Number(v) || 1.0 })}
        min={0.01}
        max={1}
        step={0.01}
        disabled={disabled}
      />

      <Select
        label="Criterion"
        tooltip="Function to measure split quality. friedman_mse is generally preferred."
        value={params.criterion}
        onChange={(v) =>
          onChange({ criterion: v as GradientParams["criterion"] })
        }
        options={[
          { value: "friedman_mse", label: "Friedman MSE" },
          { value: "squared_error", label: "Squared Error" },
        ]}
        disabled={disabled}
      />

      <Input
        label="Max Depth"
        tooltip="Maximum depth of individual trees. Controls model complexity."
        type="number"
        value={params.max_depth}
        onChange={(v) => onChange({ max_depth: Number(v) || 3 })}
        min={1}
        disabled={disabled}
      />

      <Select
        label="Max Features"
        tooltip="Number of features to consider for best split. Fewer features = faster but potentially less accurate."
        value={params.max_features ?? "auto"}
        onChange={(v) =>
          onChange({
            max_features: v === "auto" ? null : (v as "sqrt" | "log2"),
          })
        }
        options={[
          { value: "auto", label: "Auto (all)" },
          { value: "sqrt", label: "Square Root" },
          { value: "log2", label: "Log2" },
        ]}
        disabled={disabled}
      />

      <Input
        label="Max Leaf Nodes"
        tooltip="Maximum number of leaf nodes per tree. Limits tree complexity."
        type="number"
        value={params.max_leaf_nodes ?? ""}
        onChange={(v) =>
          onChange({ max_leaf_nodes: v === "" ? null : Number(v) })
        }
        placeholder="Unlimited"
        min={2}
        disabled={disabled}
      />

      <Input
        label="Min Samples Split"
        tooltip="Minimum samples required to split a node. Higher values prevent overfitting."
        type="number"
        value={params.min_samples_split}
        onChange={(v) => onChange({ min_samples_split: Number(v) || 2 })}
        min={2}
        disabled={disabled}
      />

      <Input
        label="Min Samples Leaf"
        tooltip="Minimum samples at a leaf node. Higher values create smoother models."
        type="number"
        value={params.min_samples_leaf}
        onChange={(v) => onChange({ min_samples_leaf: Number(v) || 1 })}
        min={1}
        disabled={disabled}
      />

      <Input
        label="Min Weight Fraction Leaf"
        tooltip="Minimum weighted fraction of total weights at a leaf. Use for weighted samples."
        type="number"
        value={params.min_weight_fraction_leaf}
        onChange={(v) => onChange({ min_weight_fraction_leaf: Number(v) || 0 })}
        min={0}
        max={0.5}
        step={0.01}
        disabled={disabled}
      />

      <Input
        label="Min Impurity Decrease"
        tooltip="Minimum impurity decrease required for a split. Acts as early stopping criterion."
        type="number"
        value={params.min_impurity_decrease}
        onChange={(v) => onChange({ min_impurity_decrease: Number(v) || 0 })}
        min={0}
        step={0.01}
        disabled={disabled}
      />

      <Input
        label="CCP Alpha"
        tooltip="Complexity parameter for cost-complexity pruning. Higher values create simpler trees."
        type="number"
        value={params.ccp_alpha}
        onChange={(v) => onChange({ ccp_alpha: Number(v) || 0 })}
        min={0}
        step={0.01}
        disabled={disabled}
      />

      <Input
        label="N Iter No Change"
        tooltip="Iterations without improvement before stopping. Leave empty to disable early stopping."
        type="number"
        value={params.n_iter_no_change ?? ""}
        onChange={(v) =>
          onChange({ n_iter_no_change: v === "" ? null : Number(v) })
        }
        placeholder="Disabled"
        min={1}
        disabled={disabled}
      />

      <Input
        label="Validation Fraction"
        tooltip="Fraction of training data for early stopping validation."
        type="number"
        value={params.validation_fraction}
        onChange={(v) => onChange({ validation_fraction: Number(v) || 0.1 })}
        min={0.01}
        max={0.5}
        step={0.01}
        disabled={disabled || !earlyStoppingEnabled}
      />

      <Input
        label="Tolerance"
        tooltip="Minimum improvement to qualify as progress for early stopping."
        type="number"
        value={params.tol}
        onChange={(v) => onChange({ tol: Number(v) || 1e-4 })}
        min={0}
        step={1e-5}
        disabled={disabled || !earlyStoppingEnabled}
      />
    </div>
  );
}

interface HistGradientParamsFormProps {
  params: HistGradientParams;
  onChange: (params: Partial<HistGradientParams>) => void;
  disabled?: boolean;
}

function HistGradientParamsForm({
  params,
  onChange,
  disabled,
}: HistGradientParamsFormProps) {
  const earlyStoppingEnabled =
    params.early_stopping === true || params.early_stopping === "auto";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Input
        label="Learning Rate"
        tooltip="Step size for gradient descent. Lower = slower but more stable training."
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
        tooltip="Maximum number of boosting iterations. More iterations can improve accuracy."
        type="number"
        value={params.max_iter}
        onChange={(v) => onChange({ max_iter: Number(v) || 100 })}
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Depth"
        tooltip="Maximum depth of each tree. Controls model complexity."
        type="number"
        value={params.max_depth ?? ""}
        onChange={(v) => onChange({ max_depth: v === "" ? null : Number(v) })}
        placeholder="Unlimited"
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Leaf Nodes"
        tooltip="Maximum leaf nodes per tree. 31 is a common default."
        type="number"
        value={params.max_leaf_nodes ?? ""}
        onChange={(v) =>
          onChange({ max_leaf_nodes: v === "" ? null : Number(v) })
        }
        placeholder="Unlimited"
        min={2}
        disabled={disabled}
      />

      <Input
        label="Min Samples Leaf"
        tooltip="Minimum samples at leaf nodes. Higher = more regularization."
        type="number"
        value={params.min_samples_leaf}
        onChange={(v) => onChange({ min_samples_leaf: Number(v) || 1 })}
        min={1}
        disabled={disabled}
      />

      <Input
        label="Max Bins"
        tooltip="Max bins for histogram-based splitting. Higher = more precise but slower."
        type="number"
        value={params.max_bins}
        onChange={(v) => onChange({ max_bins: Number(v) || 255 })}
        min={2}
        max={255}
        disabled={disabled}
      />

      <Input
        label="L2 Regularization"
        tooltip="L2 penalty on leaf weights. Higher values reduce overfitting."
        type="number"
        value={params.l2_regularization}
        onChange={(v) => onChange({ l2_regularization: Number(v) || 0 })}
        min={0}
        step={0.01}
        disabled={disabled}
      />

      <Select
        label="Early Stopping"
        tooltip="Stop training when validation score stops improving. Auto enables for large datasets."
        value={String(params.early_stopping)}
        onChange={(v) => {
          const value = v === "auto" ? "auto" : v === "true";
          onChange({ early_stopping: value });
        }}
        options={[
          { value: "false", label: "Off" },
          { value: "true", label: "On" },
          { value: "auto", label: "Auto" },
        ]}
        disabled={disabled}
      />

      <Input
        label="Validation Fraction"
        tooltip="Fraction of data for early stopping validation."
        type="number"
        value={params.validation_fraction}
        onChange={(v) => onChange({ validation_fraction: Number(v) || 0.1 })}
        min={0.01}
        max={0.5}
        step={0.01}
        disabled={disabled || !earlyStoppingEnabled}
      />

      <Input
        label="N Iter No Change"
        tooltip="Iterations without improvement before stopping."
        type="number"
        value={params.n_iter_no_change}
        onChange={(v) => onChange({ n_iter_no_change: Number(v) || 10 })}
        min={1}
        disabled={disabled || !earlyStoppingEnabled}
      />

      <Input
        label="Tolerance"
        tooltip="Minimum improvement to qualify as an improvement."
        type="number"
        value={params.tol}
        onChange={(v) => onChange({ tol: Number(v) || 1e-7 })}
        min={0}
        step={1e-8}
        disabled={disabled || !earlyStoppingEnabled}
      />

      <Select
        label="Scoring"
        tooltip="Scoring method for early stopping. Loss uses the loss function, accuracy uses classification accuracy."
        value={params.scoring ?? "auto"}
        onChange={(v) =>
          onChange({
            scoring: v === "auto" ? null : (v as "accuracy" | "loss"),
          })
        }
        options={[
          { value: "auto", label: "Auto (loss)" },
          { value: "loss", label: "Loss" },
          { value: "accuracy", label: "Accuracy" },
        ]}
        disabled={disabled || !earlyStoppingEnabled}
      />

      <Select
        label="Class Weight"
        tooltip="Weight classes inversely proportional to frequency. Useful for imbalanced datasets."
        value={params.class_weight ?? "none"}
        onChange={(v) =>
          onChange({ class_weight: v === "none" ? null : (v as "balanced") })
        }
        options={[
          { value: "none", label: "None" },
          { value: "balanced", label: "Balanced" },
        ]}
        disabled={disabled}
      />

      <Checkbox
        label="Warm Start"
        tooltip="Reuse previous solution and add more boosting iterations."
        checked={params.warm_start}
        onChange={(warm_start) => onChange({ warm_start })}
        disabled={disabled}
      />
    </div>
  );
}
