# Frontend Compare Sequence

## Overview
Add a "Sequence" mode to Compare that runs comparisons across multiple mask rates automatically. When Sequence is enabled, it disables manual Mask Rate and Impute controls and instead runs a full sequence of comparisons at predefined mask rates, testing both with and without imputation for each non-zero mask rate.

## Requirements
- Add a "Sequence" checkbox in `CompareDatasetParams` next to the Impute checkbox
- When Sequence is checked:
  - Mask Rate slider is disabled (grayed out)
  - Impute checkbox is disabled (grayed out)
  - Comparison runs across mask rates: 0%, 10%, 20%, 30%, 40%, 50%, 60%
  - For each mask rate > 0, runs both with impute=false and impute=true
  - Generates a single comparison chart showing all models across all mask rates
- When Sequence is unchecked (default):
  - Current behavior preserved: manual Mask Rate and Impute controls work as before
- Sequence checkbox state persisted to localStorage with other compare params

## Layout

**CompareDatasetParams with Sequence:**
```
┌─────────────────────────────────────────────────┐
│ Dataset Params:                          [Reset]│
│   Mask Rate: [====○====] 30%    ☑ Impute       │
│   ☐ Sequence                                    │
└─────────────────────────────────────────────────┘
```

**When Sequence is checked:**
```
┌─────────────────────────────────────────────────┐
│ Dataset Params:                          [Reset]│
│   Mask Rate: [====○====] 30%    ☐ Impute       │  <- Both disabled/grayed
│   ☑ Sequence                                    │
└─────────────────────────────────────────────────┘
```

## Components

### CompareDatasetParams (Updated)
- Add `sequence` boolean to params interface
- Render Sequence checkbox below the Mask Rate / Impute row
- Checkbox label: "Sequence"
- When `sequence` is true:
  - Pass `disabled={true}` to the Mask Rate slider
  - Pass `disabled={true}` to the Impute checkbox
- Props change: `params.sequence` added

### SequenceCheckbox (New Component)
- Simple checkbox component for Sequence mode toggle
- Props: `checked`, `onChange`, `disabled`
- Location: `frontend/src/components/ui/SequenceCheckbox.tsx`
- Styling consistent with ImputeCheckbox

## State Management

### Updated CompareDatasetParams Interface
```typescript
interface CompareDatasetParams {
  mask: number;           // 0-100 (disabled when sequence=true)
  impute: boolean;        // (disabled when sequence=true)
  ignore_columns: number[];
  sequence: boolean;      // NEW: When true, runs full sequence comparison
}
```

### Default Values
```typescript
const DEFAULT_COMPARE_PARAMS: CompareDatasetParams = {
  mask: 0,
  impute: false,
  ignore_columns: [],
  sequence: false,        // Default to manual mode
};
```

### Persistence
- Sequence state saved to localStorage as part of `compare_params_{dataset}`
- Restored on page load with other compare params

## API Integration

### Compare Endpoint (Updated)
When `sequence=true`, the API call changes:

**Standard Compare Request:**
```json
{
  "dataset": "Iris",
  "models": ["1706540123", "1706540456"],
  "mask": 30,
  "impute": true
}
```

**Sequence Compare Request:**
```json
{
  "dataset": "Iris",
  "models": ["1706540123", "1706540456"],
  "sequence": true
}
```

Note: When `sequence=true`, `mask` and `impute` fields are omitted (backend determines sequence parameters).

### useCompare Hook Changes
- Add `sequence` to `CompareDatasetParams` type
- When `runCompare()` is called with `sequence=true`:
  - Send `{ dataset, models, sequence: true }` without mask/impute
  - Backend runs full sequence comparison
- When `sequence=false`:
  - Current behavior: send `{ dataset, models, mask, impute }`

### Backend Execution Flow
When `--sequence` flag is provided:
1. Load each model from run ID directory
2. For each mask rate in [0, 10, 20, 30, 40, 50, 60]:
   - Apply mask to dataset
   - Evaluate all models WITHOUT imputation
   - If mask > 0: also evaluate all models WITH imputation
3. Collect accuracy results for all models at all mask rates
4. Generate comparison visualization using `Render.compare_accuracy_impute()`
5. Return results

### Sequence Response Format
```json
{
  "success": true,
  "compareId": "1706540999",
  "sequence": true,
  "elapsed": 12.34,
  "images": [
    "/output/compare/1706540999/sequence_comparison.png"
  ],
  "results": {
    "0": {
      "models": [
        { "runId": "123", "model": "tree", "name": "my_model", "accuracy": 0.96 }
      ]
    },
    "10": {
      "models": [
        { "runId": "123", "model": "tree", "name": "my_model", "accuracy": 0.94, "imputed": false },
        { "runId": "123", "model": "tree", "name": "my_model", "accuracy": 0.95, "imputed": true }
      ]
    },
    "20": { ... },
    "30": { ... },
    "40": { ... },
    "50": { ... },
    "60": { ... }
  }
}
```

- `elapsed`: Time in seconds to run the comparison
- `name`: Model name from `.id` file (null if unnamed)

## Visualization

### Sequence Comparison Chart
Uses `Render.compare_accuracy_impute()` style visualization:
- X-axis: Mask rate (0%, 10%, 20%, 30%, 40%, 50%, 60%)
- Y-axis: Accuracy (0 to 1.0)
- One line per model (solid line for non-imputed)
- Dashed lines for imputed variants (same color as base model)
- Legend label format: `name (model_type)` or `run_id (model_type)` if no name
  - Example with name: `my model (tree)`
  - Example without name: `123456 (forest)`
  - Imputed variant: `my model (tree) (imputed)`
- Model colors follow existing scheme:
  - tree: forestgreen
  - forest: royalblue
  - gradient: darkorange
  - hist-gradient: purple

### Output File
- `sequence_comparison.png` - Single chart showing accuracy vs mask rate for all models
- Saved to `frontend/public/output/compare/<compare_id>/`

## Visual Results

### CompareResults (Sequence Mode)
When sequence mode results are displayed:
- Show the generated comparison chart image (`sequence_comparison.png`)
- Chart shows accuracy trends across all mask rates for each model
- Solid lines: without imputation
- Dashed lines: with imputation
- Individual model cards are NOT shown (too many data points)
- Just display the ImagesDisplay component with the comparison chart

### Results Layout (Sequence Mode)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Compare Images                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ sequence_comparison.png                                                 │ │
│ │ (Line chart: accuracy vs mask rate)                                     │ │
│ │                                                                         │ │
│ │   1.0 ┬─────────────────────────────────────────────                   │ │
│ │       │  ●━━━━●━━━━●━━━━●                                               │ │
│ │       │        ○╌╌╌╌○╌╌╌╌○╌╌╌╌○╌╌╌╌○   <- dashed = imputed              │ │
│ │   0.5 ┼                         ●━━━━●━━━━●                             │ │
│ │       │                              ○╌╌╌╌○╌╌╌╌○                        │ │
│ │   0.0 ┴─────────────────────────────────────────────                   │ │
│ │       0%   10%   20%   30%   40%   50%   60%                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Details
- Sequence checkbox should be visually consistent with Impute checkbox styling
- When Reset button is clicked, `sequence` resets to `false`
- Compare button text remains "Compare Models" (no change for sequence mode)
- Loading state shows spinner as usual during sequence comparison
- Mask rates are fixed: [0, 10, 20, 30, 40, 50, 60] - not configurable by user

## Related specs
- [frontend/Compare](Compare.md) - Parent Compare mode specification
- [Compare](../Compare.md) - Backend compare.py script (handles sequence mode)
- [lib/Render](../lib/Render.md) - Visualization utilities (compare_accuracy_impute function)
