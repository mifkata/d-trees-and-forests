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
| `--models <IDs>` | Comma-separated run IDs (e.g., `1706540123,1706540456,1706540789`) |
| `--mask <PERCENT>` | Mask percentage for comparison (0-100) |
| `--impute` | Impute missing values during comparison |
| `--compare-id <ID>` | Optional: Use provided compare ID instead of generating new one |
| `--images` | Generate visualization images to `frontend/public/output/compare/<compare_id>/` |

**Note:** `--ignore-columns` is NOT used in Model ID mode. Feature columns are automatically determined from the models' `runtime.json`.

**Requirements:**
- At least one model ID must be provided via `--models`
- Each ID maps to directory: `frontend/public/output/<ID>/`
- Each directory must contain `model.pkl`
- Each directory must contain `runtime.json` for validation (includes `datasetParams.ignore_columns`)
- Each directory must contain `result.json` for training accuracy
- Models can have different `ignore_columns` - comparison uses the intersection of columns
- Any combination of model types is allowed (tree, forest, gradient, hist-gradient)
- Model type is auto-detected from `runtime.json["model"]` field

**Validation:**
- Read `runtime.json` from each provided ID directory
- Verify `runtime.json["dataset"]` matches the `--dataset` argument
- Auto-detect model type from `runtime.json["model"]` field
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
1. Parse comma-separated IDs from `--models` argument
2. Read `runtime.json` from each model directory to get model type and `datasetParams.ignore_columns`
3. For each model:
   - Load the full dataset (no train/test split)
   - Apply mask rate and imputation if specified
   - Drop columns based on THIS model's `ignore_columns` from its runtime.json
   - Load model from `model.pkl`
   - Evaluate on dataset with model's own column configuration
   - Get training accuracy from `result.json`
4. Return JSON with trainAccuracy, compareAccuracy, and modelColumns

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
  "elapsed": 5.23,
  "models": [
    {
      "runId": "1706540123",
      "model": "tree",
      "columns": [0, 2, 3],
      "trainAccuracy": 0.96,
      "compareAccuracy": 0.92,
      "imputed": false
    },
    {
      "runId": "1706540456",
      "model": "forest",
      "columns": [2, 3],
      "trainAccuracy": 0.98,
      "compareAccuracy": 0.95,
      "imputed": false
    },
    {
      "runId": "1706540789",
      "model": "gradient",
      "columns": [0, 2, 3],
      "trainAccuracy": 0.97,
      "compareAccuracy": 0.94,
      "imputed": true
    }
  ]
}
```

- `compareId`: Unique identifier for this comparison run (timestamp)
- `elapsed`: Time in seconds to run the comparison
- `models`: Array of model results (order matches input `--models` order)
  - `runId`: The run ID provided in `--models`
  - `model`: Model type auto-detected from runtime.json (tree, forest, gradient, hist-gradient)
  - `columns`: Array of column indices that were **used** for training
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

The `columns` from each model in the compare result can be displayed as read-only info after comparison completes, showing which columns were used.

### Compare Mode Detection
- `CompareDatasetParams` receives a new prop: `hideColumns?: boolean`
- When `hideColumns` is true, the entire "Feature Columns" section is not rendered
- The parent component sets `hideColumns={true}` when in Compare (Model ID) mode

### CompareModelsList Component
The "Models to Compare" section header should include:
- A count of added models in parentheses after the title (e.g., "Models to Compare (3)")
- Count only shown when at least one model is added
- Button labeled "All models" appears next to the section title
  - When clicked, populates the models list with all available models from history
  - One entry per unique run in the history (avoids duplicates)
  - Models are sorted by: model type, then named runs before unnamed runs, then alphabetically by name or ID
  - Button is disabled when history is loading or empty
- Button labeled "Clear" appears next to "All models"
  - When clicked, removes all models from the compare list
  - Button is disabled when no models are added

### CompareResults Component - Add Individual Models
Each result card should have a clickable icon to add that model:
- Icon appears on the left side of the model's display name (ID or name)
- Icon is a "plus" or "add" style icon
- When clicked, adds the model to "Models to Compare" if not already present
- If model is already in the list, clicking does nothing (or shows visual feedback)
- Requires callback prop: `onAddModel?: (runId: string, modelType: string) => void`

**Implementation Details:**
- `ModelAccuracyCard` receives optional `onAddModel` prop
- Icon only displays when `onAddModel` is provided
- Icon uses consistent styling with other action icons in the UI
- Parent passes down the callback that:
  1. Checks if runId already exists in models list
  2. If not, adds a new entry with the model type and runId
  3. Ensures an empty row remains at the end for adding more models

### CompareResults Component - Model Links
The model's display name (ID or name) in each result card should be a clickable link:
- Links to the model's detail page: `/output/{runId}/`
- Display text shows the model's name if available, otherwise the runId
- Link opens in a new tab (target="_blank")
- Styled as a standard link (underline on hover)

## Related specs
- [train/DecisionTree](train/DecisionTree.md) - Tree model being compared
- [train/RandomForest](train/RandomForest.md) - Forest model being compared
- [train/GradientBoostedTrees](train/GradientBoostedTrees.md) - Gradient model being compared
- [train/HistGradientBoostedTrees](train/HistGradientBoostedTrees.md) - Hist gradient model being compared
- [lib/Render](lib/Render.md) - Visualization utilities
- [lib/Model](lib/Model.md) - Model persistence including runtime.json format
- [frontend/CompareSequence](frontend/CompareSequence.md) - Frontend Sequence mode UI
