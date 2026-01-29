# Model

## Overview
Model evaluation and reporting utilities. Provides consistent accuracy output across all training scripts.

## Requirements
- Calculate accuracy score from true and predicted labels
- Support two output modes:
  - Full mode: Print "Accuracy: XX.XX%" and sklearn classification report
  - JSON mode: Print JSON with accuracy, classification_report, and optional model_info

## Implementation Details
- **Library**: sklearn.metrics (accuracy_score, classification_report)
- **Method**: `Model.report(y_true, y_pred, json_output=False, model_info=None)` static method
- **Location**: `lib/model/report.py`
- **NumpyEncoder**: Custom JSON encoder for numpy types (int64, float64, ndarray)

## Related specs
- [lib/Args](Args.md) - Provides json flag
- [train/DecisionTree](../train/DecisionTree.md) - Uses Model.report
- [train/RandomForest](../train/RandomForest.md) - Uses Model.report
- [train/GradientBoostedTrees](../train/GradientBoostedTrees.md) - Uses Model.report
