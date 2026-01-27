# Dataset

## Overview
Container class exposing dataset loaders and rendering utilities. Provides unified interface for data loading and visualization.

## Requirements
- Expose `Dataset.Iris` - Iris flower dataset loader
- Expose `Dataset.Income` - Adult Income dataset loader
- Expose `Dataset.Render` - Visualization utilities

## Implementation Details
- **Location**: `lib/dataset/__init__.py`
- **Pattern**: Static class aggregating submodules

## Related specs
- [lib/Dataset-Iris](Dataset-Iris.md) - Iris dataset implementation
- [lib/Dataset-Income](Dataset-Income.md) - Income dataset implementation
- [lib/Dataset-Render](Dataset-Render.md) - Visualization implementation
