# Model

## Overview
Model evaluation and reporting utilities. Provides consistent accuracy output across all training scripts.

## Requirements
- Calculate accuracy score from true and predicted labels
- Support two output modes:
  - Full mode: Print "Accuracy: XX.XX%" and sklearn classification report
  - JSON mode: Print comprehensive JSON output (see JSON Output Format below)
- When `run_id` is provided:
  - Save fitted model to `frontend/public/output/<run_id>/model.pkl` using joblib
  - Save `runtime.json` with dataset config, model config, and run parameters

## JSON Output Format

When `--json` flag is passed, output includes:

### Input Parameters
All parameters used for the training run:
- `dataset`: Dataset name (Iris/Income)
- `mask`: Mask percentage
- `split`: Test split percentage
- `impute`: Whether imputation was used
- `ignore_columns`: List of ignored column indices (if any)
- `run_id`: Run identifier (10-digit timestamp)
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
    "run_id": "1706540123",
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

## Model Persistence

When `run_id` is provided, save artifacts to `frontend/public/output/<run_id>/`:

### model.pkl
- Fitted sklearn model saved using `joblib.dump()`
- Can be loaded later with `joblib.load()` for manual testing/inference

### <model>_<dataset>_<score>.id
- Empty marker file for quick identification of run parameters
- Filename format: `<model>_<dataset>_<score>.id`
  - `model`: Model type (tree/forest/gradient)
  - `dataset`: Dataset name (Iris/Income)
  - `score`: Accuracy as 6-digit zero-padded integer (multiply by 1,000,000 and floor)
    - Example: 0.98 → 980000
    - Example: 0.00991 → 009910
    - Example: 0.123456 → 123456
- Examples: `tree_Iris_980000.id`, `forest_Income_875432.id`

### result.json
- Complete JSON output from the training run (same as stdout when `--json` is passed)
- Contains accuracy, classification_report, model_info, feature_importance, datasets, etc.
- Saved automatically when `run_id` is provided and `json_output=True`

### runtime.json
Contains all parameters needed to reproduce the run and restore UI state:
```json
{
  "run_id": "1706540123",
  "dataset": "Iris",
  "model": "tree",
  "datasetParams": {
    "mask": 30,
    "split": 33,
    "impute": true,
    "ignore_columns": [0],
    "use_output": false,
    "images": true
  },
  "modelParams": {
    "criterion": "gini",
    "max_depth": 5,
    "min_samples_split": 2
  }
}
```

### Methods
| Method | Description |
|--------|-------------|
| `Model.save(clf, run_id)` | Save fitted model to `model.pkl` |
| `Model.save_runtime(params, run_id)` | Save runtime config to `runtime.json` |
| `Model.save_id(run_id, model, dataset, accuracy)` | Save empty `.id` marker file with model/dataset/score in filename |

## Implementation Details
- **Library**: sklearn.metrics (accuracy_score, classification_report), joblib
- **Method**: `Model.report(y_true, y_pred, json_output=False, model_info=None, ...)` static method
- **Method**: `Model.save(clf, run_id)` - saves model.pkl using joblib
- **Method**: `Model.save_runtime(params, run_id)` - saves runtime.json
- **Method**: `Model.save_id(run_id, model, dataset, accuracy)` - saves empty .id marker file
- **Location**: `lib/model/report.py`
- **NumpyEncoder**: Custom JSON encoder for numpy types (int64, float64, ndarray)
- **Output path**: `frontend/public/output/<run_id>/` (same as Dataset export)

## Related specs
- [lib/Args](Args.md) - Provides json flag
- [train/DecisionTree](../train/DecisionTree.md) - Uses Model.report
- [train/RandomForest](../train/RandomForest.md) - Uses Model.report
- [train/GradientBoostedTrees](../train/GradientBoostedTrees.md) - Uses Model.report
