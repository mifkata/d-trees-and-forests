# Frontend Form

## Overview
Form components for selecting dataset, model, and configuring training parameters.

## Requirements
- Dataset selector dropdown (Iris, Income)
- Model selector dropdown (Decision Tree, Random Forest, Gradient Boosting, Hist Gradient Boosting)
- Dataset and Model parameters displayed in separate tabs (only one visible at a time)
- Dataset parameters: mask slider, split slider, column selection, checkboxes
- Model-specific parameters card that changes based on selected model
- Reset buttons to restore default values (reset only, do not trigger training or any other action)
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
- **History button**: Next to the "Model" label, displays "History" text button
  - Opens HistoryModal (see [HistoryModal spec](HistoryModal.md))
- Props: `value`, `onChange`, `disabled`

### ParamsTabs
- Tab component to switch between Dataset and Model parameters
- Two tabs: "Dataset" and "Model"
- Only one tab content visible at a time
- Active tab state managed locally
- Props: `activeTab`, `onTabChange`, `children`

### DatasetParams
- Card with header "Dataset Parameters" and Reset button (resets to defaults only, does not trigger training)
- Mask rate slider (0-100%, step 5) with "Impute" checkbox next to label
  - Impute checkbox is disabled when mask rate is 0
- Split slider for train/test split (10-90%, step 5, default 30) - defines test set percentage
- Column selection: list of available columns with checkboxes to include/exclude
  - Columns fetched based on selected dataset
  - Deselected columns are passed as `ignore_columns` array
  - All columns selected by default
- Note: Images are always generated (--images flag always passed to scripts)
- Props: `params`, `columns`, `onChange`, `onReset`, `disabled`

### ModelParams
- Card with header showing model name and Reset button (resets to defaults only, does not trigger training)
- Renders model-specific form based on `model` prop:
  - **TreeParamsForm** (DecisionTreeClassifier):
    - criterion (gini/entropy/log_loss)
    - splitter (best/random)
    - max_features (auto/sqrt/log2)
    - max_depth, max_leaf_nodes
    - min_samples_split, min_samples_leaf
    - min_impurity_decrease, ccp_alpha
  - **ForestParamsForm** (RandomForestClassifier):
    - n_estimators, criterion, max_features
    - max_depth, max_leaf_nodes, max_samples
    - min_samples_split, min_samples_leaf
    - min_impurity_decrease, ccp_alpha, n_jobs
    - bootstrap, oob_score (disabled if bootstrap=false), warm_start
  - **GradientParamsForm** (GradientBoostingClassifier):
    - loss (log_loss/exponential)
    - learning_rate, n_estimators, subsample
    - criterion (friedman_mse/squared_error)
    - max_depth, max_leaf_nodes, max_features (None/sqrt/log2)
    - min_samples_split, min_samples_leaf
    - min_impurity_decrease, min_weight_fraction_leaf, ccp_alpha
    - n_iter_no_change (None or int), validation_fraction, tol (disabled if n_iter_no_change is None)
  - **HistGradientParamsForm** (HistGradientBoostingClassifier):
    - learning_rate, max_iter
    - max_depth, max_leaf_nodes, min_samples_leaf, max_bins
    - l2_regularization
    - early_stopping (off/on/auto)
    - validation_fraction, n_iter_no_change, tol (disabled if early_stopping=off)
    - scoring (auto/loss/accuracy), class_weight, warm_start
- Props: `model`, `params`, `onChange`, `onReset`, `disabled`

### TrainButton
- Full-width primary button with `type="submit"`
- Shows spinner and "Training..." text when loading
- Props: `loading` (no onClick - submission handled by parent form)

## Column Selection

### Available Columns by Dataset
Columns displayed as a list of checkboxes. User can deselect columns to exclude them from training.

- **Select All toggle**: Checkbox at the top of the column list to select/deselect all columns at once
  - Checked when all columns are selected
  - Unchecked when any column is deselected
  - Clicking toggles all columns on/off

- **Copy/Paste Selection**: Buttons to copy column selection and paste to other models
  - **Copy** button: Always visible, copies current `ignore_columns` for the current dataset to clipboard state
    - Stored in memory (not localStorage) as `{ dataset: DatasetId, ignore_columns: number[] }`
    - Button shows copy icon with "Copy" text
    - Copies selection tagged with current dataset type (Iris or Income)
  - **Paste** button: Applies copied selection to current model
    - Only visible when clipboard contains selection for the **same dataset type**
    - If clipboard is empty or contains selection for a different dataset, button is hidden
    - Button shows paste icon with "Paste" text
    - Pasting does NOT clear the clipboard - selection can be pasted multiple times
  - Use case: Configure columns for one model, copy, switch to another model, paste to use same columns
  - Note: Clipboard is cleared only on page refresh, not when pasting

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

### Clipboard State
- `columnClipboard: { dataset: DatasetId, ignore_columns: number[] } | null`
- Stored in React state (memory only, not persisted to localStorage)
- Set when user clicks "Copy" button
- **NOT cleared when pasting** - allows multiple paste operations with same selection
- Cleared only on page refresh
- Used to determine if "Paste" button should be visible:
  - Visible only when `columnClipboard !== null` AND `columnClipboard.dataset === currentDataset`
  - Hidden when clipboard is empty or dataset doesn't match

## Implementation Details
- **UI Components**: Button, Select, Input, Checkbox, Slider, Card, Tabs from `components/ui`
- **State Management**: `useParamsCache` hook manages all form state with localStorage persistence
- **Parameter Keys**: All parameter names use snake_case matching Python model parameters
- **Grid Layout**: Responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) for model params
- **Form Submission**: Left column wrapped in `<form onSubmit={handleTrain}>` with `e.preventDefault()`. TrainButton is `type="submit"`. Allows Enter key in any input to trigger training.
- **Tabs**: Dataset and Model tabs switch visibility of respective parameter cards
- **Run ID**: Each training run is assigned a unique `--run-id` parameter (10-digit Unix timestamp in seconds, e.g., `1706540123`). This ID is used to organize output files in `frontend/public/output/<run_id>/`
- **Navigation**: After training completes successfully, navigate to `/?run_id=<run_id>` to display results

## Related specs
- [frontend/Layout](Layout.md) - Page structure
- [frontend/Output](Output.md) - Results display
- [frontend/HistoryModal](HistoryModal.md) - History modal for viewing/deleting runs
