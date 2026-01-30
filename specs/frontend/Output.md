# Frontend Output

## Overview
Components for displaying training results, datasets, and errors.

## Requirements
- Results displayed in tabbed interface (Results tab, Dataset tab)
- Results tab: accuracy badge, classification report table, model info, feature importance, execution time
- Dataset tab: sortable table showing train/test data with filtered fields
- Error card with dismissible display, error details, and optional stack trace
- Accuracy badge color-coded by performance (green ≥90%, yellow ≥70%, red <70%)

## Components

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
- **Generated Images section**: Grid of PNG images from the run
  - Fetches list of `.png` files from `/output/<runId>/`
  - Displays as thumbnail grid (responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop)
  - Clicking image opens fullscreen zoomable modal
  - **Zoomable Image Modal**:
    - Dark overlay with image centered
    - Zoom controls in header: zoom out (-), reset, zoom in (+), close (X)
    - Shows current zoom percentage
    - Keyboard shortcuts: +/- to zoom, 0 to reset, Esc to close
    - Ctrl+Scroll to zoom in/out
    - Scroll to pan when zoomed in
    - Footer shows keyboard hints
    - Zoom range: 10% to 500%, step 10%
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

## Related specs
- [frontend/Layout](Layout.md) - Page structure
- [frontend/Form](Form.md) - Form inputs
