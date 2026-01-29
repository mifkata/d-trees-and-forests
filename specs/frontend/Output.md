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
- Elevated card variant with `position: relative` for loading overlay positioning
- Tabbed interface with two tabs: "Results" and "Dataset"
- Loading spinner in bottom-right corner when `isLoading` is true
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
- Execution time footer

#### Dataset Tab
- Toggle to switch between Train and Test data
- Sortable table displaying dataset records
- Columns: only feature columns that were used (filtered by ignore_columns)
- Click column header to sort ascending/descending
- Maximum 100 rows shown at once with pagination or "showing X of Y" indicator
- If impute was used, train data shows imputed values
- Visual indicator for which dataset is shown (Train/Test) and row count

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
- **Loading Spinner**: Positioned absolutely in bottom-right corner of ResultsDisplay card, shown when `isLoading` prop is true
- **Tabs**: Use same tab component pattern as Form params tabs

## Related specs
- [frontend/Layout](Layout.md) - Page structure
- [frontend/Form](Form.md) - Form inputs
