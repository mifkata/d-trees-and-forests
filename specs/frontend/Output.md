# Frontend Output

## Overview
Components for displaying training results, datasets, errors, and shared visual components used across train and compare modes.

## Requirements
- Results displayed in tabbed interface (Results tab, Dataset tab)
- Results tab: accuracy badge, classification report table, model info, feature importance, execution time
- Dataset tab: sortable table showing train/test data with filtered fields
- Error card with dismissible display, error details, and optional stack trace
- Accuracy badge color-coded by performance (green ≥90%, yellow ≥70%, red <70%)
- Shared visual components extracted for reuse across Train and Compare modes

## Components

### TrainLoadingState
- Displayed when training is in progress (`isLoading` is true) and no result yet
- Also displayed when auto-loading latest run (`isLoadingLatest` is true)
- Replaces the "Configure parameters and click Train to see results" empty state
- Shows centered spinner with "Loading..." text
- Card container matching the empty state styling

### ResultsDisplay
- Elevated card variant
- Tabbed interface with two tabs: "Results" and "Dataset"
- Loading spinner displayed to the left of the accuracy badge when `isLoading` is true
- Props: `result: TrainResult`, `isLoading?: boolean`

#### Results Tab
- Header with "Results" title and accuracy badge
- Classification report table with columns: Class, Precision, Recall, F1-Score, Support
- Rows for each class, accuracy row, macro avg, weighted avg
- Model info section (conditional, based on model type):
  - Tree: depth, number of leaves
  - Forest: number of estimators, OOB score
  - Gradient: number of iterations
- Feature importance section: horizontal metric bars for each feature
  - Same base color for all bars (e.g., blue-500)
  - Bar opacity/intensity determined by importance value (e.g., 0.90 importance = 0.9 alpha)
  - Feature name on left, importance value on right
  - Bars sorted by importance descending
- **Visuals section**: Uses shared `ImageGallery` component (see Shared Visual Components below)
- Execution time footer

#### Dataset Tab
- Toggle to switch between Train and Test data
- Sortable table displaying dataset records
- Columns: only feature columns that were used (filtered by ignore_columns)
- Click column header to sort ascending/descending
- Maximum 100 rows shown at once with pagination or "showing X of Y" indicator
- If impute was used, train data shows imputed values
- Visual indicator for which dataset is shown (Train/Test) and row count
- **Horizontal scrolling**: Table container has `overflow-x-auto` for wide datasets
- **Fullscreen mode**: Button (expand icon) opens table in a fullscreen modal
  - Modal covers viewport with semi-transparent backdrop
  - Contains the same sortable table with Train/Test toggle
  - Open via expand button click or pressing F key (when Dataset tab is active)
  - Close via ESC key or X button in modal header
  - Modal header shows "Dataset - Train" or "Dataset - Test"

### ErrorDisplay
- Card with red/error styling
- Header with "Training Failed" and dismiss button
- Error message and code
- Expandable details section with raw output
- Optional stack trace display
- Props: `error: TrainError`, `onDismiss`

## Data Types

### TrainResult
```typescript
{
  accuracy: number;
  accuracyPercent: string;
  classificationReport: {
    classes: { label, precision, recall, f1Score, support }[];
    accuracy: number;
    macroAvg: { precision, recall, f1Score, support };
    weightedAvg: { precision, recall, f1Score, support };
  };
  modelInfo?: {
    type: ModelId;
    nIterations?: number;
    nEstimators?: number;
    oobScore?: number;
    treeDepth?: number;
    nLeaves?: number;
  };
  featureImportance?: Record<string, number>;
  params?: {
    dataset: string;
    mask: number;
    split: number;
    impute: boolean;
    ignore_columns: number[];
  };
  trainData?: Record<string, unknown>[];
  testData?: Record<string, unknown>[];
  trainLabels?: string[];
  testLabels?: string[];
  featureNames?: string[];
  executionTime: number;
}
```

### TrainError
```typescript
{
  message: string;
  code: ErrorCode;
  details?: string;
  stackTrace?: string;
}
```

## Shared Visual Components

Components extracted for reuse across Train results and Compare results.

### ImageGallery
- Fetches and displays PNG images in a responsive grid
- **Props:**
  - `runId?: string` - Training run ID (fetches from `/api/images?runId=...`)
  - `compareId?: string` - Compare run ID (fetches from `/api/images?compareId=...`)
  - One of `runId` or `compareId` must be provided
- Displays loading spinner while fetching
- Returns null if no images found
- Grid layout: 2 cols mobile, 3 cols tablet, 4 cols desktop
- Each image has a beautified label below it (full name, not truncated):
  - Remove file extension (`.png`)
  - Replace dashes (`-`) and underscores (`_`) with spaces
  - Capitalize each word (Title Case)
  - Example: `feature_importance-chart.png` → "Feature Importance Chart"
- Clicking image opens `ZoomableImageModal`

### ZoomableImageModal
- Fullscreen modal for viewing images with zoom/pan capabilities
- **Props:**
  - `src: string | null` - Image source URL (null to hide modal)
  - `onClose: () => void` - Callback to close modal
- **Features:**
  - Dark overlay with image centered
  - Zoom controls in header: zoom out (-), reset, zoom in (+), close (X)
  - Shows current zoom percentage
  - Keyboard shortcuts: +/- to zoom, 0 to reset, Esc to close
  - Ctrl+Scroll to zoom in/out at pointer location
  - Scroll to pan when zoomed in
  - Footer shows keyboard hints
  - Zoom range: 10% to 500%, step 10%

### beautifyImageName (utility)
- Transforms image filename to human-readable label
- **Input:** Full image path (e.g., `/output/123/feature_importance-chart.png`)
- **Output:** Beautified name (e.g., "Feature Importance Chart")
- **Logic:**
  1. Extract filename from path
  2. Remove file extension
  3. Replace dashes and underscores with spaces
  4. Capitalize each word (Title Case)

## Implementation Details
- **Badge Component**: Uses `variant` prop for color (success/warning/error)
- **Table**: Responsive with `overflow-x-auto` wrapper
- **Sortable Table**: Click header to toggle sort, display sort indicator (arrow)
- **Pagination**: Show max 100 rows, display "Showing 1-100 of X rows"
- **Error Details**: Collapsible section using disclosure pattern
- **Loading Spinner**: Displayed inline to the left of the accuracy badge in the header, shown when `isLoading` prop is true
- **Tabs**: Use same tab component pattern as Form params tabs
- **Fullscreen Modal**:
  - Fixed position overlay with `inset-0`, `z-50`, semi-transparent black backdrop
  - White modal container with padding, max-width for large screens
  - Header with title and X close button
  - useEffect hook to handle keyboard shortcuts:
    - F key opens fullscreen (when Dataset tab active and modal closed)
    - ESC key closes modal
  - Body scroll locked when modal is open
- **Shared components location**: `frontend/src/components/ImageGallery.tsx`
  - Export `ImageGallery`, `ZoomableImageModal`, and `beautifyImageName`
  - Import into `ResultsDisplay.tsx` and `Compare.tsx`

## Related specs
- [frontend/Layout](Layout.md) - Page structure
- [frontend/Form](Form.md) - Form inputs
- [frontend/Compare](Compare.md) - Compare mode (uses shared visual components)
