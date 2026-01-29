# Frontend Form

## Overview
Form components for selecting dataset, model, and configuring training parameters.

## Requirements
- Dataset selector dropdown (Iris, Income)
- Model selector dropdown (Decision Tree, Random Forest, Gradient Boosted Trees)
- Dataset and Model parameters displayed in separate tabs (only one visible at a time)
- Dataset parameters: mask slider, split slider, column selection, checkboxes
- Model-specific parameters card that changes based on selected model
- Reset buttons to restore default values
- Only submit button disabled during training (inputs remain enabled to preserve focus)
- Parameters cached per dataset/model combination in localStorage
- Pressing Enter inside any parameter input triggers form submission
- Form uses native HTML form submission pattern (`<form onSubmit>`) for accessibility and keyboard support

## Components

### DatasetSelector
- Dropdown with dataset options
- Props: `value`, `onChange`, `disabled`

### ModelSelector
- Dropdown with model options
- Props: `value`, `onChange`, `disabled`

### ParamsTabs
- Tab component to switch between Dataset and Model parameters
- Two tabs: "Dataset" and "Model"
- Only one tab content visible at a time
- Active tab state managed locally
- Props: `activeTab`, `onTabChange`, `children`

### DatasetParams
- Card with header "Dataset Parameters" and Reset button
- Mask rate slider (0-100%, step 5)
- Split slider for train/test split (10-90%, step 5, default 30) - defines test set percentage
- Column selection: list of available columns with checkboxes to include/exclude
  - Columns fetched based on selected dataset
  - Deselected columns are passed as `ignore_columns` array
  - All columns selected by default
- Checkboxes: Impute missing values, Generate images, Use cached dataset
- Props: `params`, `columns`, `onChange`, `onReset`, `disabled`

### ModelParams
- Card with header showing model name and Reset button
- Renders model-specific form based on `model` prop:
  - **TreeParamsForm**: criterion, splitter, max_depth, min_samples_split, min_samples_leaf, max_features
  - **ForestParamsForm**: n_estimators, criterion, max_depth, min_samples_split, min_samples_leaf, max_features, max_samples, bootstrap, oob_score
  - **GradientParamsForm**: learning_rate, max_iter, max_depth, max_leaf_nodes, min_samples_leaf, max_bins, early_stopping
- Props: `model`, `params`, `onChange`, `onReset`, `disabled`

### TrainButton
- Full-width primary button with `type="submit"`
- Shows spinner and "Training..." text when loading
- Props: `loading` (no onClick - submission handled by parent form)

## Column Selection

### Available Columns by Dataset
Columns displayed as a list of checkboxes. User can deselect columns to exclude them from training.

**Iris Dataset:**
- SepalLengthCm (index 0)
- SepalWidthCm (index 1)
- PetalLengthCm (index 2)
- PetalWidthCm (index 3)

**Income Dataset:**
- age (index 0)
- workclass (index 1)
- fnlwgt (index 2)
- education (index 3)
- education.num (index 4)
- marital.status (index 5)
- occupation (index 6)
- relationship (index 7)
- race (index 8)
- sex (index 9)
- capital.gain (index 10)
- capital.loss (index 11)
- hours.per.week (index 12)
- native.country (index 13)

### State Management
- `ignore_columns: number[]` - Array of column indices to exclude
- Stored in DatasetParams alongside other parameters
- Passed to API as comma-separated string for `--dataset-ignore-columns`

## Implementation Details
- **UI Components**: Button, Select, Input, Checkbox, Slider, Card, Tabs from `components/ui`
- **State Management**: `useParamsCache` hook manages all form state with localStorage persistence
- **Parameter Keys**: All parameter names use snake_case matching Python model parameters
- **Grid Layout**: Responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) for model params
- **Form Submission**: Left column wrapped in `<form onSubmit={handleTrain}>` with `e.preventDefault()`. TrainButton is `type="submit"`. Allows Enter key in any input to trigger training.
- **Tabs**: Dataset and Model tabs switch visibility of respective parameter cards

## Related specs
- [frontend/Layout](Layout.md) - Page structure
- [frontend/Output](Output.md) - Results display
