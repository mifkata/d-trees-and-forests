# Decision Tree Classifier

## Overview
Train a single decision tree classifier on tabular datasets with support for missing values, configurable hyperparameters, and optional visualization outputs.

## Requirements
- Load dataset based on `--dataset` flag (Iris or Income)
- Apply data masking when `--mask` percentage is specified
- Optionally impute missing values in training set when `--impute` flag is present
- Load model hyperparameters from YAML config file (`config/tree-{dataset}.yml`)
- Override model hyperparameters via `--model-config` flag (JSON string with snake_case keys, e.g. `--model-config '{"max_depth": 10, "criterion": "entropy"}'`)
- Train sklearn DecisionTreeClassifier
- Output accuracy and classification report (or JSON summary with `--json`)
- Generate visualizations when `--images` flag is present:
  - Feature correlation heatmap
  - Tree structure visualization
  - Feature importance bar chart
  - Decision boundaries (for datasets with ≤6 features)

## Implementation Details
- **Library**: sklearn.tree.DecisionTreeClassifier
- **Data split**: Configurable via `--split` (default 33% test, 67% train), random_state=42
- **Config loading**: YAML files with all sklearn DecisionTreeClassifier parameters; CLI `--model-config` JSON overrides YAML values
- **Config merging**: YAML config loaded first, then `--model-config` JSON merged (CLI takes precedence); keys use snake_case (e.g. `max_depth`)
- **Imputation**: KNNImputer (n_neighbors=5, weights="distance") applied to training set only
- **Visualization**: matplotlib for all plots, exported to `./output/` directory

## Related specs
- [train/RandomForest](RandomForest.md) - Ensemble of decision trees
- [train/GradientBoostedTrees](GradientBoostedTrees.md) - Gradient boosted tree ensemble
- [lib/Render](../lib/Render.md) - Visualization utilities
