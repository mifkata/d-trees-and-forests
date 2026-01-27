# Dataset.Render

## Overview
Visualization utilities for model analysis. Generates matplotlib plots for feature analysis, tree visualization, and model interpretation.

## Requirements
- Manage plot lifecycle with `header()` and `footer()` methods
- Support mask-rate-prefixed output filenames
- Generate the following visualizations:

### Common
| Method | Description |
|--------|-------------|
| `set_mask(mask_rate)` | Set mask percentage for filename prefixes |
| `header(figsize, subplots)` | Initialize figure/axes |
| `footer(filename, title, dpi)` | Save and close figure |
| `heatmap(X, filename)` | Feature correlation heatmap |

### Decision Tree
| Method | Description |
|--------|-------------|
| `tree(clf, feature_names, class_names, filename)` | Tree structure visualization |
| `tree_importance(clf, feature_names, filename)` | Feature importance bar chart |
| `tree_boundaries(clf, X, y, feature_names, filename_prefix)` | Decision boundaries for feature pairs |

### Random Forest
| Method | Description |
|--------|-------------|
| `forest_importance(clf, feature_names, filename, color, title)` | Feature importance bar chart |
| `forest_trees(clf, feature_names, class_names, grid_sizes, filename_prefix)` | Sample trees in grid layouts |
| `forest_pdp(clf, X, feature_names, filename, target)` | Partial Dependence Plots |
| `forest_ice(clf, X, feature_names, filename, target)` | Individual Conditional Expectation plots |
| `forest_oob(clf, filename)` | Out-of-bag error visualization |
| `forest_proximity(clf, X, filename)` | Proximity matrix heatmap |

### Gradient Boosted Trees
| Method | Description |
|--------|-------------|
| `gradient_forest_importance(importances, feature_names, filename)` | Feature importance (permutation-based) |
| `gradient_forest_staged(clf, X_train, X_test, y_train, y_test, filename)` | Staged training accuracy |
| `gradient_forest_trees(clf, feature_names, filename)` | Sample trees by class and iteration |

## Implementation Details
- **Libraries**: matplotlib, seaborn, sklearn.tree.plot_tree, sklearn.inspection (PartialDependenceDisplay, DecisionBoundaryDisplay)
- **Location**: `lib/dataset/render.py`
- **Output directory**: `./output/`
- **Filename format**: `{base}_{mask_pct}.{ext}`
- **Default DPI**: 150

## Related specs
- [lib/Dataset](Dataset.md) - Parent container
- [train/DecisionTree](../train/DecisionTree.md) - Uses tree visualization methods
- [train/RandomForest](../train/RandomForest.md) - Uses forest visualization methods
- [train/GradientBoostedTrees](../train/GradientBoostedTrees.md) - Uses gradient visualization methods
