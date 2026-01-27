# Dataset

## Overview
Container class exposing dataset loaders. Provides unified interface for data loading.

## Requirements
- Expose `Dataset.Iris` - Iris flower dataset loader
- Expose `Dataset.Income` - Adult Income dataset loader

## Implementation Details
- **Location**: `lib/dataset/__init__.py`
- **Pattern**: Static class aggregating submodules

## Related specs
- [lib/Dataset-Iris](Dataset-Iris.md) - Iris dataset implementation
- [lib/Dataset-Income](Dataset-Income.md) - Income dataset implementation
- [lib/Render](Render.md) - Visualization utilities (separate top-level import)
