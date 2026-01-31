# Frontend Compare

## Overview
Compare mode allows users to select three pre-trained models (tree, forest, gradient) from training history and run a comparison benchmark with configurable mask rate and column selection. This integrates with the `compare.py` script.

## Requirements
- Compare appears as a mode tab alongside "Train" at the top of the form
- When Compare mode is active:
  - Model selector is hidden
  - Dataset selector extends to full width
  - Two sub-tabs: "Dataset" and "Models"
  - Dataset tab shows mask slider, impute checkbox, column selection (NO split slider)
  - Models tab shows three model selectors from history
  - Form submits to compare API with mask and ignore_columns params
- User selects one model of each type from history:
  - Decision Tree (required)
  - Random Forest (required)
  - Gradient Boosted Trees (required)
- Only runs matching the selected dataset are shown in history dropdowns
- Compare button is disabled until all three models are selected
- Comparison evaluates models on the full dataset (no train/test split)
- Results display comparison visualization from `compare.py`

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
│ [Dataset] [Models]                      │  <- Sub-tabs
├─────────────────────────────────────────┤
│ Dataset Tab:                            │
│   Mask Rate: [====○====] 30%            │
│   ☑ Impute missing values               │
│   Columns: ☑ All  [Copy] [Paste]        │
│     ☑ SepalLengthCm                     │
│     ☑ SepalWidthCm                      │
│     ...                                 │
│                                         │
│ Models Tab:                             │
│   Decision Tree:    [Select run... ▼]   │
│   Random Forest:    [Select run... ▼]   │
│   Gradient Boosted: [Select run... ▼]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Compare Models]                        │
└─────────────────────────────────────────┘
```

**When Train Mode is Active:**
```
┌──────────────────┐ ┌──────────────────┐
│ Dataset: [Iris]  │ │ Model: [Tree]    │
└──────────────────┘ └──────────────────┘

┌─────────────────────────────────────────┐
│ [Dataset] [Model]                       │  <- Different sub-tabs
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
- Shows: mask slider, impute checkbox, column selection
- Hides: split slider (not needed for compare)
- Props: `params`, `dataset`, `onChange`

### CompareModelsTab
- Content for the Models sub-tab in Compare mode
- Shows three model selectors (tree, forest, gradient)
- Each selector shows history runs filtered by current dataset
- Props: `dataset`, `selection`, `onSelectionChange`, `history*`

### ModelHistorySelect
- Dropdown showing runs from training history
- Displays: "Name or Run ID - Accuracy% - time ago"
  - If run has a custom name, displays name with underscores as spaces
  - Otherwise displays run ID
- Filters by dataset and model type
- Props: `label`, `runs`, `value`, `onChange`

### CompareButton
- Submit button for Compare mode
- Disabled until all three models are selected
- Shows "Compare Models" text
- Shows spinner when comparing
- Props: `loading`, `disabled`, `onClick`

### CompareResults
- Displays comparison output images
- Shows accuracy stats for all three models:
  - Training accuracy (original accuracy when model was trained)
  - Compare accuracy (accuracy with current mask/impute/ignore_columns)
  - Accuracy ratio (compare/train) with visual indicator:
    - Green (↑): ratio >= 0.99 (performance maintained or improved)
    - Yellow (→): ratio >= 0.95 (slight degradation)
    - Red (↓): ratio < 0.95 (significant degradation)
- Props: `result`

## State Management

### Compare Mode State
```typescript
interface CompareState {
  mode: 'train' | 'compare';
  compareTab: 'dataset' | 'models';
  selection: CompareSelection;
  datasetParams: {
    mask: number;
    impute: boolean;
    ignore_columns: number[];
  };
}

interface CompareSelection {
  tree: string | null;
  forest: string | null;
  gradient: string | null;
}
```

## API Integration

### Compare Endpoint
API route: `POST /api/compare`

**Request:**
```json
{
  "dataset": "Iris",
  "tree": "1706540123",
  "forest": "1706540456",
  "gradient": "1706540789",
  "mask": 30,
  "impute": true,
  "ignore_columns": [0, 1]
}
```

**Backend Execution:**
```bash
python compare.py --dataset Iris \
  --tree 1706540123 --forest 1706540456 --gradient 1706540789 \
  --mask 30 --impute --ignore-columns 0,1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "images": [
      "/output/accuracy_comparison.png",
      "/output/accuracy_comparison_impute.png"
    ],
    "models": {
      "tree": { "runId": "1706540123", "trainAccuracy": 0.96, "compareAccuracy": 0.92 },
      "forest": { "runId": "1706540456", "trainAccuracy": 0.98, "compareAccuracy": 0.95 },
      "gradient": { "runId": "1706540789", "trainAccuracy": 0.97, "compareAccuracy": 0.94 }
    }
  }
}
```

## History Filtering

Each ModelHistorySelect fetches from `/api/history` with filters:

| Model Type | API Call |
|------------|----------|
| Decision Tree | `/api/history?model=tree&dataset=Iris` |
| Random Forest | `/api/history?model=forest&dataset=Iris` |
| Gradient Boosted | `/api/history?model=gradient&dataset=Iris` |

## Implementation Details

- **Mode Persistence**: Active mode (train/compare) saved to localStorage as `tab_mode`
- **Tab Persistence**: Active sub-tabs saved to localStorage:
  - Train mode: `tab_train` (dataset/model)
  - Compare mode: `tab_compare` (dataset/models)
- **Selection Persistence**: Selected model IDs saved per dataset
- **Validation**: All three models must be from same dataset
- **Error Handling**: Show error if selected run no longer exists
- **Lazy History Loading**: History is fetched only when Compare mode Models tab is opened
- **History Refresh**: Re-fetch history each time Models tab is activated
- **Dataset Params**: Mask and ignore_columns are separate from Train mode params

## Related specs
- [frontend/Layout](Layout.md) - Page structure
- [frontend/Form](Form.md) - Form controls and tabs
- [Compare](../Compare.md) - Backend compare.py script
