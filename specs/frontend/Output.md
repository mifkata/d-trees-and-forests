# Frontend Output

## Overview
Components for displaying training results and errors.

## Requirements
- Results card showing accuracy badge, classification report table, model info, and execution time
- Error card with dismissible display, error details, and optional stack trace
- Accuracy badge color-coded by performance (green ≥90%, yellow ≥70%, red <70%)

## Components

### ResultsDisplay
- Elevated card variant with `position: relative` for loading overlay positioning
- Header with "Results" title and accuracy badge
- Classification report table with columns: Class, Precision, Recall, F1-Score, Support
- Rows for each class, accuracy row, macro avg, weighted avg
- Model info section (conditional, based on model type):
  - Tree: depth, number of leaves
  - Forest: number of estimators, OOB score
  - Gradient: number of iterations
- Execution time footer
- Loading spinner in bottom-right corner when `isLoading` is true (provides visual feedback that new training is in progress while previous results remain visible)
- Props: `result: TrainResult`, `isLoading?: boolean`

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
- **Error Details**: Collapsible section using disclosure pattern
- **Loading Spinner**: Positioned absolutely in bottom-right corner of ResultsDisplay card, shown when `isLoading` prop is true. Uses same spinner as TrainButton for consistency. Provides extra visibility that training is in progress without hiding previous results.

## Related specs
- [frontend/Layout](Layout.md) - Page structure
- [frontend/Form](Form.md) - Form inputs
