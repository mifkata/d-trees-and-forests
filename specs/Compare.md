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

## Implementation Details
- **Location**: `compare.py`
- **Dependencies**: subprocess for running training scripts, json for parsing output, lib.Render for visualization
- **Scripts tested**: `train-tree.py`, `train-forest.py`, `train-gradient-forest.py`
- **Mask values**: 0, 5, 10, 15, ..., 90
- **Output files**: `./output/accuracy_comparison.png`, `./output/accuracy_comparison_impute.png`

### Model ID Parameters
Load pre-trained models from existing run directories instead of training fresh:

| Parameter | Description |
|-----------|-------------|
| `--tree <ID>` | Run ID for decision tree model |
| `--forest <ID>` | Run ID for random forest model |
| `--gradient <ID>` | Run ID for gradient boosted model |

**Requirements:**
- At least one ID parameter must be provided when using this mode
- Each ID maps to directory: `frontend/public/output/<ID>/`
- Each directory must contain `model.pkl`
- Each directory must contain `runtime.json` for validation

**Validation:**
- Read `runtime.json` from each provided ID directory
- Verify `runtime.json["dataset"]` matches the `--dataset` argument
- Verify `runtime.json["model"]` matches the expected model type:
  - `--tree` ID must have `model: "tree"`
  - `--forest` ID must have `model: "forest"`
  - `--gradient` ID must have `model: "gradient-forest"`
- Exit with error if validation fails

### Execution Flow
1. Initialize results dict for each model (with and without impute)
2. For each mask value:
   - First script runs with `--json --mask` (generates new dataset)
   - Subsequent scripts run with `--json --mask --use-output true` (reuse dataset)
   - All scripts also run with `--impute` flag using cached dataset
3. Extract accuracy from JSON output (`output["accuracy"]`)
4. Pass results to `Render.compare_accuracy()` and `Render.compare_accuracy_impute()`

### JSON Output Parsing
Scripts output JSON with warnings potentially before the JSON object. Parser finds first `{` and last `}` to extract JSON, then reads `accuracy` field.

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
