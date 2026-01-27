# Decision Tree Classifier

## Overview
Train a single decision tree classifier on tabular datasets with support for missing values, configurable hyperparameters, and optional visualization outputs.

## Requirements
- Load dataset based on `--dataset` flag (Iris or Income)
- Apply data masking when `--mask` percentage is specified
- Optionally impute missing values in training set when `--impute` flag is present
- Load model hyperparameters from YAML config file (`config/tree-{dataset}.yml`)
- Train sklearn DecisionTreeClassifier
- Output accuracy and classification report (or accuracy only with `--accuracy-only`)
- Generate visualizations when `--images` flag is present:
  - Feature correlation heatmap
  - Tree structure visualization
  - Feature importance bar chart
  - Decision boundaries (for datasets with ≤6 features)

## Implementation Details
- **Library**: sklearn.tree.DecisionTreeClassifier
- **Data split**: 2/3 training, 1/3 testing (random_state=42)
- **Config loading**: YAML files with all sklearn DecisionTreeClassifier parameters
- **Imputation**: KNNImputer (n_neighbors=5, weights="distance") applied to training set only
- **Visualization**: matplotlib for all plots, exported to `./output/` directory

## Related specs
- [train/RandomForest](RandomForest.md) - Ensemble of decision trees
- [train/GradientBoostedTrees](GradientBoostedTrees.md) - Gradient boosted tree ensemble
- [lib/Render](../lib/Render.md) - Visualization utilities
