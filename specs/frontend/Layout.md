# Frontend Layout

## Overview
Page structure and component composition for the training and comparison interface.

## Requirements
- Next.js App Router layout with metadata
- Inter font from Google Fonts
- Responsive container with max-width constraint
- Loading skeleton while hydrating from localStorage
- Single-page application with vertically stacked sections

## Root Layout
- HTML document with Inter font
- Metadata title: "Model Trainer"
- Body renders page children directly

## Routes

### `/` (Home)
Main training interface. Supports `?run_id=<run_id>` query parameter.

When `run_id` query param is present:
- Fetches `/output/<run_id>/runtime.json` to restore form state (dataset, model, params)
- Fetches `/output/<run_id>/result.json` to display results
- Form is pre-populated with saved run data
- If loading fails (run not found), automatically redirects to `/` (new run)

After training completes, navigates to `/?run_id=<new_run_id>`.

## Page Composition

**Header**: Page title "Model Trainer"

**Main Content**: Two-column layout on desktop, stacked on mobile.

**Left Column (Form)**:
- Main mode tabs: "Train" / "Compare"
- When **Train** mode:
  - DatasetSelector and ModelSelector in a row
  - Tabs: "Dataset", "Model" for parameter configuration
  - DatasetParams with mask slider (with impute checkbox), split slider, column selection
  - ModelParams renders the appropriate form based on selected model type
  - TrainButton at bottom
- When **Compare** mode:
  - DatasetSelector only (full width)
  - Tabs: "Dataset", "Models" for configuration
  - Dataset tab: mask slider (with impute checkbox), column selection (NO split slider)
  - Models tab: three model selectors to pick runs from history
  - CompareButton at bottom

**Right Column (Output)**:
- ErrorDisplay (dismissible) when training/compare fails
- ResultsDisplay when training succeeds
- CompareResults when compare succeeds
- Empty state or placeholder when no results yet

## Hydration
Skeleton placeholder shown until client hydration completes, preventing flash of default values before localStorage loads. Skeleton mimics the layout structure with animated gray blocks.

## State Management
- useParamsCache: manages dataset, model, and parameters with localStorage persistence
- useTraining: manages loading state, results, and errors
- useCompare: manages compare mode selection, dataset params, and compare results
- Parameters cached per dataset+model combination
- Tab states persisted in localStorage:
  - `tab_mode`: Current mode (train/compare)
  - `tab_train`: Current Train mode sub-tab (dataset/model)
  - `tab_compare`: Current Compare mode sub-tab (dataset/models)

## Related specs
- [frontend/Form](Form.md) - Form input components
- [frontend/Output](Output.md) - Results and error display
- [frontend/Compare](Compare.md) - Compare mode for model comparison
