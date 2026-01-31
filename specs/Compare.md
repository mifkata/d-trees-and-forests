# Compare

## Overview
Benchmark script that runs all training models across varying mask rates and generates comparison visualizations. Supports two modes: run fresh training or load pre-trained models from run IDs.

## Requirements
- Run each training script (tree, forest, gradient, hist-gradient) with `--json` flag
- Parse accuracy from JSON output
- Test mask rates from 0% to 90% in 5% increments
- For each mask rate, test both with and without `--impute` flag
- Reuse cached masked datasets across models (first script generates, others reuse)
- Generate two comparison plots:
  - Basic comparison (without impute variants)
  - Full comparison (with impute variants)
- Support loading pre-trained models via run IDs (see Model ID Parameters below)
- Generate a unique `compare_id` (timestamp) when running with model IDs
- Output images to `frontend/public/output/compare/<compare_id>/`

## Implementation Details
- **Location**: `compare.py`
- **Dependencies**: subprocess for running training scripts, json for parsing output, lib.Render for visualization
- **Scripts tested**: `train-tree.py`, `train-forest.py`, `train-gradient.py`, `train-hist-gradient.py`
- **Mask values**: 0, 5, 10, 15, ..., 90
- **Output files (fresh mode)**: `./output/accuracy_comparison.png`, `./output/accuracy_comparison_impute.png`
- **Output files (model ID mode)**: `frontend/public/output/compare/<compare_id>/*.png`

### Model ID Parameters
Load pre-trained models from existing run directories instead of training fresh:

| Parameter | Description |
|-----------|-------------|
| `--tree <ID>` | Run ID for decision tree model |
| `--forest <ID>` | Run ID for random forest model |
| `--gradient <ID>` | Run ID for gradient boosted model |
| `--hist-gradient <ID>` | Run ID for hist gradient boosted model |
| `--mask <PERCENT>` | Mask percentage for comparison (0-100) |
| `--impute` | Impute missing values during comparison |
| `--compare-id <ID>` | Optional: Use provided compare ID instead of generating new one |
| `--images` | Generate visualization images to `frontend/public/output/compare/<compare_id>/` |

**Note:** `--ignore-columns` is NOT used in Model ID mode. Feature columns are automatically determined from the models' `runtime.json`.

**Requirements:**
- All four ID parameters must be provided when using this mode
- Each ID maps to directory: `frontend/public/output/<ID>/`
- Each directory must contain `model.pkl`
- Each directory must contain `runtime.json` for validation (includes `datasetParams.ignore_columns`)
- Each directory must contain `result.json` for training accuracy
- Models can have different `ignore_columns` - comparison uses the intersection of columns

**Validation:**
- Read `runtime.json` from each provided ID directory
- Verify `runtime.json["dataset"]` matches the `--dataset` argument
- Verify `runtime.json["model"]` matches the expected model type:
  - `--tree` ID must have `model: "tree"`
  - `--forest` ID must have `model: "forest"`
  - `--gradient` ID must have `model: "gradient"`
  - `--hist-gradient` ID must have `model: "hist-gradient"`
- Exit with error if validation fails

### Compare ID Generation
When running with model IDs (comparison mode):
- Generate `compare_id` as Unix timestamp (seconds since epoch), similar to `run_id`
- If `--compare-id` is provided, use that value instead
- Create output directory: `frontend/public/output/compare/<compare_id>/`
- Return `compare_id` in JSON output

### Execution Flow (Fresh Training Mode)
1. Initialize results dict for each model (with and without impute)
2. For each mask value:
   - First script runs with `--json --mask` (generates new dataset)
   - Subsequent scripts run with `--json --mask --use-output true` (reuse dataset)
   - All scripts also run with `--impute` flag using cached dataset
3. Extract accuracy from JSON output (`output["accuracy"]`)
4. Pass results to `Render.compare_accuracy()` and `Render.compare_accuracy_impute()`

### Execution Flow (Model ID Mode)
1. Read `runtime.json` from each model directory to get `datasetParams.ignore_columns`
2. For each model:
   - Load the full dataset (no train/test split)
   - Apply mask rate and imputation if specified
   - Drop columns based on THIS model's `ignore_columns` from its runtime.json
   - Load model from `model.pkl`
   - Evaluate on dataset with model's own column configuration
   - Get training accuracy from `result.json`
3. Return JSON with trainAccuracy, compareAccuracy, and modelColumns

**Column Handling:**
- The `--ignore-columns` CLI argument is **ignored** in Model ID mode
- Each model is evaluated using its OWN column configuration from `runtime.json`
- Models with different `ignore_columns` are supported - each is evaluated on its training columns
- This ensures fair comparison as each model sees the same column structure it was trained with

### JSON Output Parsing
Scripts output JSON with warnings potentially before the JSON object. Parser finds first `{` and last `}` to extract JSON, then reads `accuracy` field.

### Model ID Mode Output
When running with model IDs, outputs JSON with both training and comparison accuracies:

```json
{
  "success": true,
  "compareId": "1706540999",
  "modelColumns": {
    "tree": [0, 2, 3],
    "forest": [2, 3],
    "gradient": [0, 2, 3]
  },
  "models": {
    "tree": {
      "runId": "1706540123",
      "trainAccuracy": 0.96,
      "compareAccuracy": 0.92,
      "imputed": false
    },
    "forest": {
      "runId": "1706540456",
      "trainAccuracy": 0.98,
      "compareAccuracy": 0.95,
      "imputed": false
    },
    "gradient": {
      "runId": "1706540789",
      "trainAccuracy": 0.97,
      "compareAccuracy": 0.94,
      "imputed": true
    },
    "hist-gradient": {
      "runId": "1706541000",
      "trainAccuracy": 0.97,
      "compareAccuracy": 0.93
    }
  }
}
```

- `compareId`: Unique identifier for this comparison run (timestamp)
- `modelColumns`: Per-model array of column indices that were **used** for training
- `trainAccuracy`: Original accuracy from `result.json` when model was trained
- `compareAccuracy`: Accuracy when tested with current mask/impute settings using model's own columns
- `imputed`: Boolean indicating if automatic imputation was applied (for models that don't support NaN)

### Automatic Imputation Fallback
When `mask > 0` and `impute=False`, some models may not support NaN values natively (e.g., `GradientBoostingClassifier`). In this case:
- The compare script catches the NaN error during prediction
- Automatically applies KNN imputation to the dataset
- Re-evaluates the model on the imputed data
- Sets `imputed: true` in the model's result to indicate fallback was used

This allows fair comparison of models with different NaN handling capabilities.

### Comparison Images
When `--images` flag is provided in model ID mode:
- Create directory `frontend/public/output/compare/<compare_id>/`
- Generate comparison visualizations using lib.Render with `set_compare_id(compare_id)`
- Images saved to the compare output directory

| Image | Description |
|-------|-------------|
| `accuracy_bars.png` | Bar chart comparing train vs compare accuracy for each model |
| `accuracy_diff.png` | Visual representation of accuracy differences (ratio chart) |

### Color Scheme
| Model | Color |
|-------|-------|
| tree | forestgreen |
| forest | royalblue |
| gradient | darkorange |
| hist-gradient | purple |

## Frontend Requirements

### CompareDatasetParams Component
When used in Compare mode (Model ID mode), the "Feature Columns" section should be **hidden**:
- Do not display the feature column checkboxes
- Do not display the Copy/Paste/Select All buttons for columns
- The dataset will automatically use the columns the models were trained with
- Only show Mask Rate and Impute controls

The `featureColumns` from the compare result can be displayed as read-only info after comparison completes, showing which columns were used.

### Compare Mode Detection
- `CompareDatasetParams` receives a new prop: `hideColumns?: boolean`
- When `hideColumns` is true, the entire "Feature Columns" section is not rendered
- The parent component sets `hideColumns={true}` when in Compare (Model ID) mode

## Related specs
- [train/DecisionTree](train/DecisionTree.md) - Tree model being compared
- [train/RandomForest](train/RandomForest.md) - Forest model being compared
- [train/GradientBoostedTrees](train/GradientBoostedTrees.md) - Gradient model being compared
- [train/HistGradientBoostedTrees](train/HistGradientBoostedTrees.md) - Hist gradient model being compared
- [lib/Render](lib/Render.md) - Visualization utilities
- [lib/Model](lib/Model.md) - Model persistence including runtime.json format
