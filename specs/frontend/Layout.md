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
- Metadata title: "Sci-Lab Junior"
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

**Auto-Load Latest Run (Train Mode Only):**
When in Train mode, the page automatically loads the latest run for the current dataset/model combination:
- On first load with no `run_id` query param
- When switching from Compare mode to Train mode
- When changing the dataset or model selector

The auto-load behavior:
- Fetches `/api/history?model=<model>&dataset=<dataset>` to get latest run
- If a run exists, navigates to `/?run_id=<latest_run_id>`
- If no history exists, shows empty state ("Configure parameters and click Train to see results")
- Shows loading state with spinner while fetching history/loading run

## Page Composition

**Header**: Page title "Sci-Lab Junior" with run ID display and inline rename

When viewing a run (`?run_id=<run_id>`):
- Display "Run: {name or runId}" in monospace font next to the title
- Clicking the name/ID toggles inline edit mode
- If run has a custom name, display it with underscores converted to spaces

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

## Components

### Inline Run Name Editor
Inline editing for renaming a training run with a custom name.

**Trigger**: Clicking on the run name/ID in the header

**Display Mode**:
- Shows run name (with underscores displayed as spaces) or run ID if no name
- Styled as clickable with hover underline
- Tooltip: "Click to rename"
- Edit icon button (pencil) next to the name for better discoverability
  - Both clicking the name and clicking the icon trigger edit mode

**Edit Mode**:
- Text input replaces the name/ID display
- Placeholder: run ID (so user knows which run they're editing)
- Input pre-filled with current name (underscores shown as spaces) if one exists, empty otherwise
- Input width expands dynamically based on text length (minimum width based on run ID length)
- Maximum length: 50 characters
- Auto-focused when entering edit mode

**Behavior**:
- Enter key saves the name (spaces converted to underscores in filename)
- ESC key or blur cancels edit mode (unless error is showing)
- Empty submission cancels without saving
- Typing clears any existing error

**Error State**:
- Red border on input when rename API fails
- Error message displayed below input
- Input stays open on error so user can retry
- Error clears when user types or presses ESC

**Name Display Rules**:
- Stored with underscores (valid filename characters)
- Displayed to user with underscores converted to spaces
- User can type spaces; they become underscores when saved
- Allowed characters: alphanumeric, hyphens, underscores, dots, slashes, and commas
- Slashes are stored as `--` in the filename for filesystem safety

**API Call**: `POST /api/rename` with `{ runId, name }`

**File Rename Logic**:
The `.id` file in the run directory is renamed to include the custom name.

Current format: `<model>_<dataset>_<score>.id`
Example: `tree_Iris_100000.id`

New format: `<model>_<dataset>_<score>_<name>.id`
Example: `tree_Iris_100000_my_experiment.id`

When renaming again, the existing name portion is replaced:
- `tree_Iris_100000_old_name.id` → `tree_Iris_100000_new_name.id`

To remove a name, submit with empty string:
- `tree_Iris_100000_some_name.id` → `tree_Iris_100000.id`

## Related specs
- [frontend/Form](Form.md) - Form input components
- [frontend/Output](Output.md) - Results and error display
- [frontend/Compare](Compare.md) - Compare mode for model comparison
