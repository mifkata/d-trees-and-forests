# Model

## Overview
Model evaluation and reporting utilities. Provides consistent accuracy output across all training scripts.

## Requirements
- Calculate accuracy score from true and predicted labels
- Support two output modes:
  - Full mode: Print "Accuracy: XX.XX%" and sklearn classification report
  - Accuracy-only mode: Print only accuracy as 4-decimal float (e.g., "0.9800") with no newline

## Implementation Details
- **Library**: sklearn.metrics (accuracy_score, classification_report)
- **Method**: `Model.report(y_true, y_pred, accuracy_only=False)` static method
- **Location**: `lib/model/report.py`

## Related specs
- [lib/Args](Args.md) - Provides accuracy_only flag
- [train/DecisionTree](../train/DecisionTree.md) - Uses Model.report
- [train/RandomForest](../train/RandomForest.md) - Uses Model.report
- [train/GradientBoostedTrees](../train/GradientBoostedTrees.md) - Uses Model.report
