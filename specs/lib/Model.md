# Model

## Overview
Model evaluation and reporting utilities. Provides consistent accuracy output across all training scripts.

## Requirements
- Calculate accuracy score from true and predicted labels
- Support two output modes:
  - Full mode: Print "Accuracy: XX.XX%" and sklearn classification report
  - JSON mode: Print comprehensive JSON output (see JSON Output Format below)

## JSON Output Format

When `--json` flag is passed, output includes:

### Input Parameters
All parameters used for the training run:
- `dataset`: Dataset name (Iris/Income)
- `mask`: Mask percentage
- `split`: Test split percentage
- `impute`: Whether imputation was used
- `ignore_columns`: List of ignored column indices (if any)
- `model_config`: Model hyperparameters used

### Results
- `accuracy`: Float accuracy score
- `classification_report`: Full sklearn classification report as dict

### Model Info
Model-specific information:
- Tree: `type`, `tree_depth`, `n_leaves`
- Forest: `type`, `n_estimators`, `oob_score`
- Gradient: `type`, `n_iterations`

### Feature Importance
- `feature_importance`: Dict mapping feature names to importance scores
- For Tree/Forest: uses `feature_importances_` attribute
- For Gradient: uses permutation importance

### Datasets
- `train_data`: Training dataset as list of records (column names as keys)
  - If `--impute` was used, contains imputed values
- `test_data`: Test dataset as list of records
- `train_labels`: Training labels as list
- `test_labels`: Test labels as list
- `feature_names`: List of feature column names used

### Example JSON Structure
```json
{
  "params": {
    "dataset": "Iris",
    "mask": 30,
    "split": 33,
    "impute": true,
    "ignore_columns": [0],
    "model_config": {"max_depth": 5}
  },
  "accuracy": 0.96,
  "classification_report": { ... },
  "model_info": {
    "type": "tree",
    "tree_depth": 4,
    "n_leaves": 7
  },
  "feature_importance": {
    "SepalWidthCm": 0.05,
    "PetalLengthCm": 0.45,
    "PetalWidthCm": 0.50
  },
  "train_data": [...],
  "test_data": [...],
  "train_labels": [...],
  "test_labels": [...],
  "feature_names": ["SepalWidthCm", "PetalLengthCm", "PetalWidthCm"]
}
```

## Implementation Details
- **Library**: sklearn.metrics (accuracy_score, classification_report)
- **Method**: `Model.report(y_true, y_pred, json_output=False, model_info=None, ...)` static method
- **Location**: `lib/model/report.py`
- **NumpyEncoder**: Custom JSON encoder for numpy types (int64, float64, ndarray)

## Related specs
- [lib/Args](Args.md) - Provides json flag
- [train/DecisionTree](../train/DecisionTree.md) - Uses Model.report
- [train/RandomForest](../train/RandomForest.md) - Uses Model.report
- [train/GradientBoostedTrees](../train/GradientBoostedTrees.md) - Uses Model.report
