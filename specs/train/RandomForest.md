# Random Forest Classifier

## Overview
Train a random forest ensemble classifier on tabular datasets with support for missing values, configurable hyperparameters, and optional visualization outputs.

## Requirements
- Load dataset based on `--dataset` flag (Iris or Income)
- Apply data masking when `--mask` percentage is specified
- Optionally impute missing values in training set when `--impute` flag is present
- Load model hyperparameters from YAML config file (`config/forest-{dataset}.yml`)
- Train sklearn RandomForestClassifier
- Output accuracy and classification report (or accuracy only with `--accuracy-only`)
- Generate visualizations when `--images` flag is present:
  - Feature importance bar chart
  - Sample trees from the forest (2x2 grid)
  - Partial Dependence Plots (PDP) per class (for datasets with ≤6 features)
  - Individual Conditional Expectation (ICE) plots per class (for datasets with ≤6 features)
  - Out-of-bag error progression (if oob_score enabled)
  - Proximity matrix heatmap (for datasets with ≤500 samples)

## Implementation Details
- **Library**: sklearn.ensemble.RandomForestClassifier
- **Data split**: 2/3 training, 1/3 testing (random_state=42)
- **Config loading**: YAML files with all sklearn RandomForestClassifier parameters
- **Imputation**: KNNImputer (n_neighbors=5, weights="distance") applied to training set only
- **Visualization**: matplotlib for all plots, exported to `./output/` directory

## Related specs
- [train/DecisionTree](DecisionTree.md) - Single decision tree
- [train/GradientBoostedTrees](GradientBoostedTrees.md) - Gradient boosted tree ensemble
- [lib/Render](../lib/Render.md) - Visualization utilities
