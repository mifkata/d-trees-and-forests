# Gradient Boosted Trees Classifier

## Overview
Train a histogram-based gradient boosted trees classifier on tabular datasets. Natively supports missing values without imputation, configurable hyperparameters, and optional visualization outputs.

## Requirements
- Load dataset based on `--dataset` flag (Iris or Income)
- Apply data masking when `--mask` percentage is specified
- Optionally impute missing values in training set when `--impute` flag is present (though model handles NaN natively)
- Load model hyperparameters from YAML config file (`config/gradient-{dataset}.yml`)
- Train sklearn HistGradientBoostingClassifier
- Output accuracy and classification report (or accuracy only with `--accuracy-only`)
- Print model info: classifier name and number of iterations
- Generate visualizations when `--images` flag is present:
  - Feature importance bar chart (using permutation importance)

## Implementation Details
- **Library**: sklearn.ensemble.HistGradientBoostingClassifier
- **Data split**: 2/3 training, 1/3 testing (random_state=42)
- **Config loading**: YAML files with all sklearn HistGradientBoostingClassifier parameters
- **Missing values**: Native support - no imputation required, but `--impute` still available for comparison
- **Feature importance**: Computed via sklearn.inspection.permutation_importance (n_repeats=10)
- **Visualization**: matplotlib for all plots, exported to `./output/` directory

## Related specs
- [train/DecisionTree](DecisionTree.md) - Single decision tree
- [train/RandomForest](RandomForest.md) - Random forest ensemble
