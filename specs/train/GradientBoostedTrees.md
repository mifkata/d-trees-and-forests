# Gradient Boosted Trees Classifier (XGBoost-style)

## Overview
Train a histogram-based gradient boosted trees classifier using scikit-learn's HistGradientBoostingClassifier. This is scikit-learn's XGBoost-style implementation: histogram-based splitting for speed, native missing value support, and early stopping capabilities.

## Requirements
- Load dataset based on `--dataset` flag (Iris or Income)
- Apply data masking when `--mask` percentage is specified
- Optionally impute missing values in training set when `--impute` flag is present (though model handles NaN natively)
- Load model hyperparameters from YAML config file (`config/gradient-{dataset}.yml`)
- Override model hyperparameters via `--model-config` flag (JSON string with snake_case keys)
- Train sklearn HistGradientBoostingClassifier
- Output accuracy and classification report (or JSON summary with `--json`)
- Print model info: classifier name, number of boosting iterations, and early stopping info if applicable
- Generate visualizations when `--images` flag is present:
  - Feature importance bar chart (using permutation importance)

## Implementation Details
- **Library**: sklearn.ensemble.HistGradientBoostingClassifier
- **Why HistGradientBoostingClassifier**: XGBoost-style histogram-based gradient boosting, orders of magnitude faster than GradientBoostingClassifier for larger datasets, native categorical and missing value support
- **Data split**: 2/3 training, 1/3 testing (random_state=42)
- **Config loading**: YAML files with all sklearn HistGradientBoostingClassifier parameters
- **Config merging**: YAML config loaded first, then `--model-config` JSON merged (CLI takes precedence)

### Key Hyperparameters
- `learning_rate`: Shrinkage factor (default: 0.1)
- `max_iter`: Maximum number of boosting iterations (default: 100)
- `max_depth`: Maximum tree depth (default: None, unlimited)
- `max_leaf_nodes`: Maximum leaves per tree (default: 31)
- `min_samples_leaf`: Minimum samples per leaf (default: 20)
- `max_bins`: Maximum histogram bins (default: 255, max 255)
- `early_stopping`: Enable early stopping ('auto', True, False)
- `validation_fraction`: Fraction for early stopping validation (default: 0.1)
- `n_iter_no_change`: Iterations without improvement before stopping (default: 10)
- `l2_regularization`: L2 regularization term (default: 0)

### Missing Value Handling
Native support - HistGradientBoostingClassifier learns optimal split decisions for missing values during training. No imputation required, but `--impute` available for comparison experiments.

### Feature Importance
Computed via sklearn.inspection.permutation_importance (n_repeats=10) for reliable importance estimates.

## Related specs
- [train/DecisionTree](DecisionTree.md) - Single decision tree
- [train/RandomForest](RandomForest.md) - Random forest ensemble
- [lib/Render](../lib/Render.md) - Visualization utilities

## References
- [HistGradientBoostingClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.HistGradientBoostingClassifier.html)
- [Gradient Boosting Ensemble Methods](https://scikit-learn.org/stable/modules/ensemble.html#histogram-based-gradient-boosting)
