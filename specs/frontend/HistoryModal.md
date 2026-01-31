# History Modal

## Overview
Modal dialog displaying previous training runs for the selected model, with the ability to navigate to a run or delete it. Features a well-aligned table layout with consistent column widths.

## Requirements
- Modal opens from the "History" button in ModelSelector
- Displays runs in a proper table with consistent column alignment
- Delete functionality with conditional confirmation based on run name
- Clicking a run row navigates to `/?run_id=<timestamp>`
- Shows "No history found" when no runs exist

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ History - Decision Tree                                       [X]  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Name/ID          │ Accuracy  │ Time           │ Delete         │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ my experiment    │ 98.00%    │ 2 hours ago    │        [🗑️]    │ │
│ │ 1706540123       │ 96.50%    │ 1 day ago      │        [🗑️]    │ │
│ │ baseline run     │ 95.00%    │ 3 days ago     │        [🗑️]    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Table Structure

### Columns
| Column | Content | Width | Alignment |
|--------|---------|-------|-----------|
| Name/ID | Run name (spaces) or timestamp ID | auto (content-based) | left |
| Accuracy | Accuracy percentage (e.g., "98.00%") | fixed ~70px | right |
| Time | Relative time (e.g., "2 hours ago") | fixed ~90px | right |
| Delete | Delete button (trash icon) | fixed ~44px | center |

### Name/ID Display
- **No truncation**: Names are displayed in full, never cropped with ellipsis
- **No-wrap**: Text stays on a single line (`white-space: nowrap`)
- **Max length**: Names are limited to 50 characters at input time (see Layout spec)
- **Modal width**: Modal expands to fit content, with a reasonable max-width

### Implementation Options
Use one of these approaches for consistent alignment:

**Option A: CSS Grid**
```css
.history-table {
  display: grid;
  grid-template-columns: auto 70px 90px 44px;
}
.history-name {
  white-space: nowrap;
}
```

**Option B: HTML Table**
```html
<table>
  <colgroup>
    <col style="width: auto" />
    <col style="width: 70px" />
    <col style="width: 90px" />
    <col style="width: 44px" />
  </colgroup>
</table>
```

## Delete Behavior

### One-Click Delete (Default)
Runs **without** a custom name are deleted immediately with one click:
- `.id` filename format: `<model>_<dataset>_<score>.id`
- Example: `tree_Iris_100000.id`
- Click delete button → immediately removes the run directory
- No confirmation dialog

### Confirmation Delete (Named Runs)
Runs **with** a custom name show a confirmation dialog before deleting:
- `.id` filename format: `<model>_<dataset>_<score>_<name>.id`
- Example: `tree_Iris_100000_my_experiment.id`
- Click delete button → shows inline confirmation
- User must click "Confirm" to delete

### Inline Confirmation
When deleting a named run, the row transforms to show confirmation:

```
│ my experiment    │ 98.00%    │ Delete this run?  [Cancel] [Confirm] │
```

- "Delete this run?" text replaces the time column
- Cancel button restores the normal row
- Confirm button deletes the run
- Only one row can be in confirmation state at a time

### Delete API
**Endpoint:** `DELETE /api/history/<runId>`

**Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Run not found"
}
```

**Backend Action:**
- Removes the entire run directory: `frontend/public/output/<runId>/`
- Returns error if directory doesn't exist

## State Management

```typescript
interface HistoryModalState {
  isOpen: boolean;
  runs: HistoryRun[];
  isLoading: boolean;
  deleteConfirmId: string | null;  // Run ID currently showing confirmation
  isDeleting: string | null;       // Run ID currently being deleted
}

interface HistoryRun {
  runId: string;
  name: string | null;      // Custom name if exists
  accuracy: number;
  timestamp: number;        // Unix timestamp for time calculation
  hasName: boolean;         // Whether run has a custom name (for delete behavior)
}
```

## Row Interaction

### Click Behavior
- Clicking anywhere on a row (except delete button) navigates to that run
- Row has hover state to indicate clickability
- Cursor changes to pointer on hover

### Delete Button
- Positioned on the right side of each row
- Shows trash icon
- Prevents click propagation (doesn't trigger row navigation)
- Shows loading spinner while delete is in progress

## Empty State

When no history exists for the model/dataset combination:
```
┌─────────────────────────────────────────────────────────────────────┐
│ History - Decision Tree                                       [X]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    No history found                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## API Integration

### Fetch History
**Endpoint:** `GET /api/history?model=<model>&dataset=<dataset>`

**Response:**
```json
{
  "runs": [
    {
      "runId": "1706540123",
      "name": "my experiment",
      "accuracy": 0.98,
      "timestamp": 1706540123,
      "hasName": true
    },
    {
      "runId": "1706540000",
      "name": null,
      "accuracy": 0.965,
      "timestamp": 1706540000,
      "hasName": false
    }
  ]
}
```

## Implementation Details

- **Modal Component**: Uses standard modal pattern with overlay backdrop
- **Modal Width**: Uses `w-fit` to size to content, with `max-w-lg` as upper bound
- **Modal Height**: Table body scrolls vertically when content exceeds max height (`max-h-[60vh]` or similar), header remains fixed
- **Table/Grid**: Use CSS Grid or HTML table for consistent column widths
- **Name Column**: `white-space: nowrap` to prevent wrapping, no truncation/ellipsis
- **Time Formatting**: Use relative time library (e.g., date-fns `formatDistanceToNow`)
- **Optimistic Updates**: Remove row from UI immediately on delete, restore if API fails
- **Keyboard Support**: ESC closes modal, Enter on focused delete button triggers action
- **Accessibility**: Focus trap within modal, proper ARIA labels for delete buttons

## Related specs
- [frontend/Form](Form.md) - ModelSelector component that triggers this modal
- [frontend/Layout](Layout.md) - Page navigation after run selection
