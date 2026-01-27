# Compare

## Overview
Benchmark script that runs all training models across varying mask rates and generates comparison visualizations.

## Requirements
- Run each training script (tree, forest, gradient-forest) with `--accuracy-only` flag
- Test mask rates from 0% to 90% in 5% increments
- For each mask rate, test both with and without `--impute` flag
- Reuse cached masked datasets across models (first script generates, others reuse)
- Generate two comparison plots:
  - Basic comparison (without impute variants)
  - Full comparison (with impute variants)

## Implementation Details
- **Location**: `compare.py`
- **Dependencies**: subprocess for running training scripts, lib.Render for visualization
- **Scripts tested**: `train-tree.py`, `train-forest.py`, `train-gradient-forest.py`
- **Mask values**: 0, 5, 10, 15, ..., 90
- **Output files**: `./output/accuracy_comparison.png`, `./output/accuracy_comparison_impute.png`

### Execution Flow
1. Initialize results dict for each model (with and without impute)
2. For each mask value:
   - First script runs with `--mask` (generates new dataset)
   - Subsequent scripts run with `--mask --use-output true` (reuse dataset)
   - All scripts also run with `--impute` flag using cached dataset
3. Pass results to `Render.compare_accuracy()` and `Render.compare_accuracy_impute()`

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
