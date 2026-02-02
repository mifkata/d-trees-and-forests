# Compare History

## Overview
Enable compare runs to be persisted and browsable like model training runs. Each compare run saves its results and runtime parameters, allowing users to revisit past comparisons via `compare_id` in the URL. Users can rename compare runs, and a history modal displays past comparisons with their IDs and compared model names.

## Requirements
- Running `compare.py` with model IDs saves `results.json` and `runtime.json` to the compare output directory
- Compare runs are accessible via `?compare_id=<id>` URL parameter
- Navigating to Compare mode does NOT auto-load the latest `compare_id` (unlike Train mode which loads latest `run_id`)
- Users can rename compare runs; the name is stored in `runtime.json`
- History modal for compare runs shows:
  - Compare ID (timestamp)
  - Optional user-defined name
  - Model counts with labels and emojis (e.g., "4x Tree 🌳  2x Forest 🌲")

## Implementation Details

### Output Files (compare.py)
When running in Model ID mode, `compare.py` saves two JSON files to `frontend/public/output/compare/<compare_id>/`:

#### `results.json`
Contains accuracy statistics and comparison results:
```json
{
  "compareId": "1706540999",
  "mask": 10,
  "impute": false,
  "dataset": "Iris",
  "models": [
    {
      "runId": "1706540123",
      "model": "tree",
      "columns": [0, 2, 3],
      "trainAccuracy": 0.96,
      "compareAccuracy": 0.92,
      "imputed": false
    },
    {
      "runId": "1706540456",
      "model": "forest",
      "columns": [2, 3],
      "trainAccuracy": 0.98,
      "compareAccuracy": 0.95,
      "imputed": false
    }
  ]
}
```

#### `runtime.json`
Contains runtime parameters used for the comparison:
```json
{
  "compare_id": "1706540999",
  "dataset": "Iris",
  "mask": 10,
  "impute": false,
  "name": null,
  "models": [
    { "runId": "1706540123", "model": "tree" },
    { "runId": "1706540456", "model": "forest" }
  ]
}
```

The `name` field is initially `null` and updated when the user renames the compare run.

### Frontend URL Routing
- URL parameter: `?compare_id=<id>` (separate from `run_id`)
- When `compare_id` is present and mode is Compare:
  - Load `results.json` and `runtime.json` from compare directory
  - Populate comparison results display
  - Show compare run name/ID in header
- When navigating to Compare mode without `compare_id`:
  - Do NOT auto-load the latest compare run
  - Show empty state: "Add models to compare and click Compare Models"
  - User must manually select models or choose from compare history

### Compare History API

#### `GET /api/compare/history`
Lists all compare runs for a dataset.

Query params:
- `dataset` (optional): Filter by dataset name

Response:
```json
{
  "runs": [
    {
      "compareId": "1706540999",
      "dataset": "Iris",
      "timestamp": 1706540999,
      "name": "Best models v1",
      "mask": 10,
      "impute": false,
      "models": [
        { "runId": "1706540123", "model": "tree", "name": "Tree v1" },
        { "runId": "1706540456", "model": "forest", "name": null }
      ]
    }
  ]
}
```

The API reads compare directories, parses their `runtime.json`, and enriches model info with names from model `runtime.json` files.

#### `DELETE /api/compare/history/[compareId]`
Deletes a compare run by removing its directory.

Response:
```json
{
  "success": true
}
```

### History Button
A "History" link in the top right corner of the Train/Compare tabs card:
- In Compare mode: opens CompareHistoryModal, fetches fresh compare history on click
- In Train mode: opens TrainHistoryModal for the current model/dataset

### Compare History Modal
A modal showing past comparison runs. Uses `fitContent` sizing to grow horizontally as names grow (similar to TrainHistoryModal).

Display for each entry:
- Header row: Compare ID (or name if set), timestamp (formatted as "X ago" or date) - both use `whitespace-nowrap`
- Badges row (if any params set): sequence/mask/impute badges on own line
  - Sequence: shown as "sequence" badge (purple) only if sequence mode enabled
  - Mask: shown as "mask: X%" badge (amber) only if mask > 0
  - Impute: shown as "imputed" badge (blue) only if impute enabled
- Model counts row: aggregated by type, count styled larger/bolder (e.g., "**4x** Tree 🌳  **2x** Forest 🌲"), each item uses `whitespace-nowrap`

Actions:
- Click to load the compare run (directly loads data and updates URL to `?compare_id=<id>`)
- Delete button to remove compare run

### Train History Modal
A modal showing past training runs for the current model/dataset combination:
- Same functionality as the previous ModelSelector history, but as a standalone modal
- Accessible via the same History button when in Train mode

### Rename Compare Run

#### `POST /api/compare/rename`
Renames a compare run.

Request body:
```json
{
  "compareId": "1706540999",
  "name": "Best_models_v1"
}
```

Response:
```json
{
  "success": true
}
```

Updates the `name` field in `runtime.json`. Name rules:
- Spaces converted to underscores
- Max 50 characters
- Empty string or null clears the name

### Frontend Integration

#### useCompare Hook Updates
Add to the hook:
- `compareHistory`: Array of past compare runs
- `isLoadingCompareHistory`: Loading state
- `fetchCompareHistory()`: Fetch compare history (called when History button pressed)
- `deleteCompareRun(compareId)`: Delete a compare run
- `renameCompareRun(compareId, name)`: Rename a compare run
- `setCompareResult`: Allow setting compare result directly (for loading from history)

#### Page Component Updates
- Read `compare_id` from URL search params
- When `compare_id` present in Compare mode, load that comparison
- Show compare run name/ID in header (similar to train run display)
- Add rename functionality for compare runs (click name to edit)
- History button in Train/Compare tabs card opens appropriate modal
- Selecting from history directly loads data (not just URL navigation)

#### CompareHistoryModal Component
New component (`src/components/CompareHistoryModal.tsx`) showing list of past comparisons:
- Modal uses `maxWidth="lg"` with `fitContent` and `minWidth={600}` to grow horizontally as names grow
- Content is scrollable when exceeding max height
- Receives runs from parent (fetched via `fetchCompareHistory`)
- Each row shows: name/ID, timestamp, mask/impute badges, model counts with emojis
- Model counts: aggregated by type with larger/bolder count (e.g., "**4x** Tree 🌳  **2x** Forest 🌲")
- Click row to load that compare run directly
- Delete button per row

#### TrainHistoryModal Component
New component (`src/components/TrainHistoryModal.tsx`) for train run history:
- Replaces the history functionality previously in ModelSelector
- Shows runs for current model/dataset combination
- Click row to navigate to that run

#### ControlledTabs Component Update
Added `rightContent` prop to place content (like History button) in the top right corner of the tabs bar.

## Related specs
- [Compare](Compare.md) - Parent spec for compare functionality
