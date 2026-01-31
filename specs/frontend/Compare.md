# Frontend Compare

## Overview
Compare mode allows users to select an arbitrary number of pre-trained models from training history and run a comparison benchmark with configurable mask rate. This integrates with the `compare.py` script.

## Requirements
- Compare appears as a mode tab alongside "Train" at the top of the form
- When Compare mode is active:
  - Model selector is hidden
  - Dataset selector extends to full width
  - No sub-tabs (unlike Train mode) - all content shown together
  - Dataset params shown at top (mask slider, impute checkbox - NO split slider, NO column selection)
  - Horizontal divider separates dataset params from models list
  - Models list shown below with "Add Model" button
  - Form submits to compare API with mask param (ignore_columns determined from model's runtime.json)
- Users can add any number of models to compare (minimum 1 to submit)
- An empty model row is always visible at the bottom for adding new models
- When a model is selected in the empty row, a new empty row appears automatically
- Filled model rows can be removed via a delete button (empty row cannot be removed)
- Empty rows are ignored when submitting comparison
- Users CAN select the same model type multiple times, but duplicate selections are marked as errors
- Only unique model selections are valid (same run ID cannot be selected twice)
- Only runs matching the selected dataset are shown in history dropdowns
- Compare button is disabled until at least one model is selected and no duplicates exist
- Form state (added models and their selections) persisted to localStorage
- Comparison evaluates models on the full dataset (no train/test split)
- Results display comparison visualization from `compare.py`
- Triggering Compare generates a new `compare_id` (timestamp-based)
- Comparison images saved to `frontend/public/output/compare/<compare_id>/`
- Results displayed in 2-column layout (same as Train view):
  - Left column: CompareResults card with model accuracy stats
  - Right column: ImagesDisplay card with comparison visualizations

## Layout

**Mode Tabs at Top:**
```
┌─────────────────────────────────────────┐
│ [Train] [Compare]                       │  <- Mode selection
└─────────────────────────────────────────┘
```

**When Compare Mode is Active:**
```
┌─────────────────────────────────────────┐
│ Dataset: [Iris ▼]                       │  <- Full width (no Model selector)
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Dataset Params:                         │  <- No tabs, shown directly
│   Mask Rate: [====○====] 30%            │
│   ☑ Impute missing values               │
│   (No column selection - uses model's   │
│    trained columns from runtime.json)   │
├─────────────────────────────────────────┤  <- Horizontal divider
│ Models to Compare                       │
│   ┌────────────┐ ┌──────────────────┐   │
│   │ [Tree ▼]   │ │ [my_run - 96%  ▼]│[×]│  <- Filled row (can remove)
│   └────────────┘ └──────────────────┘   │
│   ┌────────────┐ ┌──────────────────┐   │
│   │ [Forest ▼] │ │ [other - 94%   ▼]│[×]│  <- Another filled row
│   └────────────┘ └──────────────────┘   │
│   ┌────────────┐ ┌──────────────────┐   │
│   │ [Select...▼│ │ [Select model.. ▼]│   │  <- Empty row (always present, no ×)
│   └────────────┘ └──────────────────┘   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Compare Models]                        │  <- Disabled if no models or duplicates
└─────────────────────────────────────────┘
```

**When Train Mode is Active:**
```
┌──────────────────┐ ┌──────────────────┐
│ Dataset: [Iris]  │ │ Model: [Tree]    │
└──────────────────┘ └──────────────────┘

┌─────────────────────────────────────────┐
│ [Dataset] [Model]                       │  <- Sub-tabs (only in Train mode)
├─────────────────────────────────────────┤
│ (existing Dataset/Model params)         │
└─────────────────────────────────────────┘
```

## Components

### ModeTabs
- Top-level tabs for switching between Train and Compare modes
- Props: `mode`, `onModeChange`
- Options: "Train", "Compare"

### CompareDatasetParams
- Subset of DatasetParams for Compare mode
- Shows: mask slider, impute checkbox, Reset button
- Hides: split slider (not needed for compare), column selection (determined from model's runtime.json)
- Reset button resets to defaults only, does not trigger comparison
- Props: `params`, `dataset`, `onChange`, `onReset`, `hideColumns`
- When `hideColumns={true}`, the Feature Columns section is not rendered

### CompareModelsList
- Content for the Models section in Compare mode
- Shows filled model rows followed by one empty row for adding new models
- Empty rows are filtered out when displaying filled models
- Props: `models`, `history`, `duplicateRunIds`, `onRemoveModel`, `onUpdateModelType`, `onUpdateModelRun`, `isLoadingHistory`

### ModelRow
- Individual model selection row with two dropdowns and optional remove button
- First dropdown: Model type (Tree, Forest, Gradient, Hist Gradient)
- Second dropdown: Runs filtered by selected model type and dataset
- When model type changes, run selection is cleared
- Second dropdown disabled until model type is selected
- Shows error state if the selected run ID is duplicated elsewhere
- Remove button only shown for filled rows (`canRemove` prop)
- Empty row has a spacer instead of remove button to maintain alignment
- Props: `allRuns`, `modelType`, `runId`, `onModelTypeChange`, `onRunChange`, `onRemove`, `isDuplicate`, `isLoading`, `canRemove`

### Run Dropdown
- Shows runs filtered by selected model type
- Displays: "Name or Run ID - Accuracy% - time ago"
  - If run has a custom name, displays name with underscores as spaces
  - Otherwise displays run ID
- **Sorting**: Named runs first (alphabetically), then unnamed runs (alphabetically by ID)
- Shows "Select model first" placeholder when no model type selected
- `error` prop: When true, shows error styling (red border) for duplicate selection

### CompareButton
- Submit button for Compare mode
- Disabled if:
  - No models are added
  - No models are selected (all dropdowns empty)
  - Duplicate selections exist
- Shows "Compare Models" text
- Shows spinner when comparing
- Props: `loading`, `disabled`, `onClick`

### CompareLoadingState
- Displayed when comparison is in progress (`isComparing` is true) and no result yet
- Replaces the "Add models and click Compare" empty state
- Shows centered spinner with "Loading..." text
- Card container matching the empty state styling

### CompareResults
- Displays accuracy stats for all compared models in a card
- Model accuracy cards displayed in a vertical column layout (stacked)
- Displays models in the order they were selected (matches API response order)
- Each model card shows:
  - Model type (tree, forest, gradient, hist-gradient)
  - Run ID
  - Training accuracy (original accuracy when model was trained)
  - Compare accuracy (accuracy with current mask/impute settings)
  - Accuracy ratio (compare/train) with visual indicator:
    - Green (↑): ratio >= 0.99 (performance maintained or improved)
    - Yellow (→): ratio >= 0.95 (slight degradation)
    - Red (↓): ratio < 0.95 (significant degradation)
- Props: `result` (includes `compareId` field and `models` array)
- Note: Visuals are shown in a separate `ImagesDisplay` component in the right column

## State Management

### Compare Mode State
```typescript
interface CompareState {
  mode: 'train' | 'compare';
  models: CompareModelEntry[];  // Dynamic list of model selections
  datasetParams: {
    mask: number;
    impute: boolean;
    // ignore_columns not used - determined from model's runtime.json
  };
}

// Each entry in the models array
interface CompareModelEntry {
  id: string;       // Unique key for React (e.g., UUID or timestamp)
  modelType: 'tree' | 'forest' | 'gradient' | 'hist-gradient' | null;  // Selected model type
  runId: string | null;  // Selected run ID, null if not yet selected
}
```

### Duplicate Detection
```typescript
// Helper to find duplicate run IDs
function getDuplicateRunIds(models: CompareModelEntry[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const model of models) {
    if (model.runId) {
      if (seen.has(model.runId)) {
        duplicates.add(model.runId);
      }
      seen.add(model.runId);
    }
  }
  return duplicates;
}
```

### Compare Result State
```typescript
interface CompareResult {
  compareId: string;  // Unique ID for this comparison run
  images: string[];   // Paths to generated images
  models: CompareModelResult[];  // Array of results (order matches input)
}

interface CompareModelResult {
  runId: string;
  model: 'tree' | 'forest' | 'gradient' | 'hist-gradient';  // Auto-detected type
  columns: number[];  // Column indices used for this model
  trainAccuracy: number;
  compareAccuracy: number;
  imputed?: boolean;  // True if automatic imputation was applied
}
```

## API Integration

### Compare Endpoint
API route: `POST /api/compare`

**Request:**
```json
{
  "dataset": "Iris",
  "models": ["1706540123", "1706540456", "1706540789"],
  "mask": 30,
  "impute": true
}
```

Note: `ignore_columns` is NOT sent - each model uses its own column configuration from `runtime.json`.

**Backend Execution:**
```bash
python compare.py --dataset Iris \
  --models 1706540123,1706540456,1706540789 \
  --mask 30 --impute --images
```

**Response:**
```json
{
  "success": true,
  "data": {
    "compareId": "1706540999",
    "images": [
      "/output/compare/1706540999/accuracy_bars.png",
      "/output/compare/1706540999/accuracy_diff.png"
    ],
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
}
```

- `models`: Array of results in same order as request
  - `model`: Model type auto-detected from runtime.json
  - `columns`: Array of column indices used for this model's evaluation
  - `imputed`: True if model couldn't handle NaN values and automatic imputation was applied

### Images Endpoint (Extended)
API route: `GET /api/images`

Supports two modes:
- Training run images: `GET /api/images?runId=<run_id>`
  - Returns images from `frontend/public/output/<run_id>/`
- Compare run images: `GET /api/images?compareId=<compare_id>`
  - Returns images from `frontend/public/output/compare/<compare_id>/`

**Response:**
```json
{
  "images": ["/output/compare/1706540999/accuracy_bars.png", "..."]
}
```

## History Filtering

A single API call fetches all runs for the current dataset:

| API Call | Description |
|----------|-------------|
| `/api/history?dataset=Iris` | All models for Iris dataset |
| `/api/history?dataset=Income` | All models for Income dataset |

Client-side filtering: The run dropdown filters the fetched history by the selected model type. When user selects "Tree" in the first dropdown, only tree runs appear in the second dropdown.

## Implementation Details

- **Mode Persistence**: Active mode (train/compare) saved to localStorage as `tab_mode`
- **Tab Persistence**: Active sub-tab saved to localStorage:
  - Train mode: `tab_train` (dataset/model)
  - Compare mode: No tabs (content shown together)
- **Models Persistence**: The entire `models` array (including entry IDs and selections) saved to localStorage as `compare_models_{dataset}` (e.g., `compare_models_Iris`)
  - On page load, restore from localStorage
  - On dataset change, load that dataset's saved models (or empty array if none)
  - On model add/remove/change, save to localStorage immediately
- **Validation**:
  - At least one model must be selected to enable Compare button
  - No duplicate run IDs allowed (duplicates shown with error styling)
- **Error Handling**: Show error if selected run no longer exists
- **History Loading**: History is fetched when Compare mode is active
- **History Refresh**: Re-fetch history when entering Compare mode or changing dataset
- **Dataset Params**: Mask and impute are separate from Train mode params (ignore_columns not used in Compare)
- **Dataset Change Behavior**: When dataset changes:
  - Save current models to `compare_models_{oldDataset}`
  - Load models from `compare_models_{newDataset}` (or empty array)
  - Re-fetch history for new dataset

## Related specs
- [frontend/Layout](Layout.md) - Page structure
- [frontend/Form](Form.md) - Form controls and tabs
- [frontend/Output](Output.md) - Shared visual components (ImageGallery, ZoomableImageModal)
- [Compare](../Compare.md) - Backend compare.py script
- [lib/Render](../lib/Render.md) - Compare visualization methods
