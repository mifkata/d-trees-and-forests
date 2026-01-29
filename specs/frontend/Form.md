# Frontend Form

## Overview
Form components for selecting dataset, model, and configuring training parameters.

## Requirements
- Dataset selector dropdown (Iris, Income)
- Model selector dropdown (Decision Tree, Random Forest, Gradient Boosted Trees)
- Dataset parameters card with mask slider and checkboxes
- Model-specific parameters card that changes based on selected model
- Reset buttons to restore default values
- Only submit button disabled during training (inputs remain enabled to preserve focus)
- Parameters cached per dataset/model combination in localStorage
- Pressing Enter inside any Model parameter input triggers form submission
- Form uses native HTML form submission pattern (`<form onSubmit>`) for accessibility and keyboard support

## Components

### DatasetSelector
- Dropdown with dataset options
- Props: `value`, `onChange`, `disabled`

### ModelSelector
- Dropdown with model options
- Props: `value`, `onChange`, `disabled`

### DatasetParams
- Card with header "Dataset Parameters" and Reset button
- Mask rate slider (0-100%, step 5)
- Split slider for train/test split (10-90%, step 5, default 30) - defines test set percentage
- Checkboxes: Impute missing values, Generate images, Use cached dataset
- Props: `params`, `onChange`, `onReset`, `disabled`

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

## Implementation Details
- **UI Components**: Button, Select, Input, Checkbox, Slider, Card from `components/ui`
- **State Management**: `useParamsCache` hook manages all form state with localStorage persistence
- **Parameter Keys**: All parameter names use snake_case matching Python model parameters
- **Grid Layout**: Responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) for model params
- **Form Submission**: Left column wrapped in `<form onSubmit={handleTrain}>` with `e.preventDefault()`. TrainButton is `type="submit"`. Allows Enter key in any input to trigger training.

## Related specs
- [frontend/Layout](Layout.md) - Page structure
- [frontend/Output](Output.md) - Results display
