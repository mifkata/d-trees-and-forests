# Compare

## Overview
Benchmark script that runs all training models across varying mask rates and generates comparison visualizations. Supports two modes: run fresh training or load pre-trained models from run IDs.

## Requirements
- Run each training script (tree, forest, gradient-forest) with `--json` flag
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
- **Scripts tested**: `train-tree.py`, `train-forest.py`, `train-gradient-forest.py`
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
| `--mask <PERCENT>` | Mask percentage for comparison (0-100) |
| `--impute` | Impute missing values during comparison |
| `--ignore-columns <LIST>` | Comma-separated column indices to ignore |
| `--compare-id <ID>` | Optional: Use provided compare ID instead of generating new one |
| `--images` | Generate visualization images to `frontend/public/output/compare/<compare_id>/` |

**Requirements:**
- All three ID parameters must be provided when using this mode
- Each ID maps to directory: `frontend/public/output/<ID>/`
- Each directory must contain `model.pkl`
- Each directory must contain `runtime.json` for validation
- Each directory must contain `result.json` for training accuracy

**Validation:**
- Read `runtime.json` from each provided ID directory
- Verify `runtime.json["dataset"]` matches the `--dataset` argument
- Verify `runtime.json["model"]` matches the expected model type:
  - `--tree` ID must have `model: "tree"`
  - `--forest` ID must have `model: "forest"`
  - `--gradient` ID must have `model: "gradient"`
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
1. Load the full dataset (no train/test split)
2. Apply mask rate and imputation if specified
3. Drop ignored columns if specified
4. For each model:
   - Load model from `model.pkl`
   - Evaluate on full dataset
   - Get training accuracy from oldest `.id` file
5. Return JSON with trainAccuracy and compareAccuracy for each model

### JSON Output Parsing
Scripts output JSON with warnings potentially before the JSON object. Parser finds first `{` and last `}` to extract JSON, then reads `accuracy` field.

### Model ID Mode Output
When running with model IDs, outputs JSON with both training and comparison accuracies:

```json
{
  "success": true,
  "compareId": "1706540999",
  "models": {
    "tree": {
      "runId": "1706540123",
      "trainAccuracy": 0.96,
      "compareAccuracy": 0.92
    },
    "forest": {
      "runId": "1706540456",
      "trainAccuracy": 0.98,
      "compareAccuracy": 0.95
    },
    "gradient": {
      "runId": "1706540789",
      "trainAccuracy": 0.97,
      "compareAccuracy": 0.94
    }
  }
}
```

- `compareId`: Unique identifier for this comparison run (timestamp)
- `trainAccuracy`: Original accuracy from `result.json` when model was trained
- `compareAccuracy`: Accuracy when tested with current mask/impute/ignore_columns settings

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
| gradient-forest | darkorange |

## Related specs
- [train/DecisionTree](train/DecisionTree.md) - Tree model being compared
- [train/RandomForest](train/RandomForest.md) - Forest model being compared
- [train/GradientBoostedTrees](train/GradientBoostedTrees.md) - Gradient model being compared
- [lib/Render](lib/Render.md) - Visualization utilities
