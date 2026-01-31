# Gradient Boosted Trees Classifier

## Overview
Train a gradient boosted trees classifier using scikit-learn's GradientBoostingClassifier. This is the classic gradient boosting implementation that builds an additive model in a forward stage-wise manner, optimizing arbitrary differentiable loss functions.

## Requirements
- Load dataset based on `--dataset` flag (Iris or Income)
- Apply data masking when `--mask` percentage is specified
- Optionally impute missing values in training set when `--impute` flag is present (required for GradientBoostingClassifier as it does not natively support missing values)
- Load model hyperparameters from YAML config file (`config/gradient-{dataset}.yml`)
- Override model hyperparameters via `--model-config` flag (JSON string with snake_case keys)
- Train sklearn GradientBoostingClassifier
- Output accuracy and classification report (or JSON summary with `--json`)
- Print model info: classifier name and number of estimators
- Generate visualizations when `--images` flag is present:
  - Feature correlation heatmap (correlation matrix of input features)
  - Clustering visualization (MDS of feature space, colored by class)

## Implementation Details
- **Library**: sklearn.ensemble.GradientBoostingClassifier
- **Script**: `train-gradient.py`
- **Why GradientBoostingClassifier**: Classic gradient boosting algorithm, well-understood behavior, good for smaller datasets, extensive hyperparameter control
- **Data split**: Configurable via `--split` (default 33% test, 67% train), random_state=42
- **Config loading**: YAML files with all sklearn GradientBoostingClassifier parameters
- **Config merging**: YAML config loaded first, then `--model-config` JSON merged (CLI takes precedence)
- **Missing Value Handling**: Requires imputation - GradientBoostingClassifier does not support NaN values natively. When `--mask` is used, `--impute` should also be used.

### Key Hyperparameters
- `loss`: Loss function (log_loss, exponential) (default: log_loss)
- `learning_rate`: Shrinkage factor (default: 0.1)
- `n_estimators`: Number of boosting stages (default: 100)
- `subsample`: Fraction of samples for fitting base learners (default: 1.0)
- `criterion`: Split quality function (friedman_mse, squared_error) (default: friedman_mse)
- `max_depth`: Maximum depth of individual trees (default: 3)
- `min_samples_split`: Minimum samples to split a node (default: 2)
- `min_samples_leaf`: Minimum samples at a leaf node (default: 1)
- `min_weight_fraction_leaf`: Minimum weighted fraction at leaf (default: 0.0)
- `max_features`: Features to consider for splits (None, sqrt, log2, int, float) (default: None)
- `max_leaf_nodes`: Maximum number of leaf nodes (default: None)
- `min_impurity_decrease`: Minimum impurity decrease for split (default: 0.0)
- `ccp_alpha`: Complexity parameter for pruning (default: 0.0)
- `validation_fraction`: Fraction for early stopping validation (default: 0.1)
- `n_iter_no_change`: Iterations without improvement before stopping (default: None)
- `tol`: Tolerance for early stopping (default: 1e-4)

### Feature Importance
Computed via `feature_importances_` attribute (mean decrease in impurity).

## Related specs
- [train/DecisionTree](DecisionTree.md) - Single decision tree
- [train/RandomForest](RandomForest.md) - Random forest ensemble
- [train/HistGradientBoostedTrees](HistGradientBoostedTrees.md) - Histogram-based gradient boosted trees
- [lib/Render](../lib/Render.md) - Visualization utilities

## References
- [GradientBoostingClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.GradientBoostingClassifier.html)
- [Gradient Boosting](https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting)
