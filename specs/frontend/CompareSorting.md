# Compare Results Sorting

## Overview
Allow users to sort compare results by different criteria: top compare score, model/score combination, or preserve the default (selection order). This provides flexibility in analyzing comparison results.

## Requirements
- Add a sort dropdown above the model accuracy cards in CompareResults
- Three sorting options:
  1. **Default** - Results shown in the order models were selected (matches API response order)
  2. **Compare Score** - Sort by highest compare accuracy first (descending)
  3. **Model/Score** - Group by model type alphabetically, then sort by compare accuracy within each group (descending)
- Sorting is applied client-side (no API changes needed)
- Sort preference should be persisted to localStorage
- Sorting only affects the display order of model cards; does not modify the underlying data

## Layout

```
┌─────────────────────────────────────────┐
│ [💾] Comparison Results     [≡] [↓] [▤]│  <- Load button on left, sort icons on right
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Model Card 1                        │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Model Card 2                        │ │
│ └─────────────────────────────────────┘ │
│ ...                                     │
└─────────────────────────────────────────┘
```

## Components

### SortIconButton
- Icon button for sort option selection
- Props: `active`, `onClick`, `icon`, `title`
- Styling: gray when inactive, blue when active
- Shows tooltip on hover with sort option name

### Sort Icons
- **Default**: List icon (bars) - selection order
- **Compare Score**: Sort descending icon (arrow down with lines) - highest accuracy first
- **Model/Score**: Grid/category icon - grouped by model type

### LoadModelsButton
- Icon button on the left side of the title
- Icon: Floppy disk / save icon
- Tooltip: "Load models into compare"
- On click: Populates the "Models to Compare" list with models from the current comparison result
- Props: `onClick`

### CompareResults (Modified)
- Add sort state with persistence to localStorage key `compare_sort`
- Render sort icon buttons in the header (right side)
- Render load models button in the header (left side of title)
- Apply sorting logic before rendering cards
- Props: `result`, `onLoadModels` (callback to load models into compare form)

## Sorting Logic

### Default
No sorting applied. Models displayed in the order they appear in `result.models` (matches selection order).

### Compare Score
```typescript
models.sort((a, b) => b.compareAccuracy - a.compareAccuracy)
```

### Model/Score
```typescript
// First, find the best compare accuracy for each model type
const bestByModel = new Map<string, number>();
for (const m of models) {
  const current = bestByModel.get(m.model) ?? -1;
  if (m.compareAccuracy > current) {
    bestByModel.set(m.model, m.compareAccuracy);
  }
}

models.sort((a, b) => {
  const aBest = bestByModel.get(a.model) ?? 0;
  const bBest = bestByModel.get(b.model) ?? 0;
  // Sort groups by best performance (descending)
  if (aBest !== bBest) return bBest - aBest;
  // If tied, sort groups alphabetically
  if (a.model !== b.model) return a.model.localeCompare(b.model);
  // Within group, sort by compare accuracy (descending)
  return b.compareAccuracy - a.compareAccuracy;
})
```

Groups are sorted by their best compare accuracy (highest first), then alphabetically if tied. Within each group, models are sorted by compare accuracy (highest first).

## State Management

```typescript
type CompareSortOption = 'default' | 'compare-score' | 'model-score';

// In CompareResults component
const [sortBy, setSortBy] = useState<CompareSortOption>(() => {
  // Load from localStorage, default to 'default'
  return (localStorage.getItem('compare_sort') as CompareSortOption) || 'default';
});

// Persist on change
useEffect(() => {
  localStorage.setItem('compare_sort', sortBy);
}, [sortBy]);
```

## Implementation Details

- **Location**: Modify `frontend/src/components/Compare.tsx`
- **New UI**: Add icon buttons in the CardHeader, right-aligned next to the title
- **Persistence**: localStorage key `compare_sort`
- **Default value**: `'default'` (no sorting)

## Related specs
- [frontend/Compare](Compare.md) - Parent Compare spec with CompareResults component
