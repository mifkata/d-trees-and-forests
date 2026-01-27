# Dataset.Iris

## Overview
Loader for the Iris flower dataset with support for masking, imputation, and caching.

## Requirements
- Load Iris dataset from Kaggle via kagglehub (`saurabh00007/iriscsv`)
- Split data 2/3 train, 1/3 test with random_state=42
- Support masking: randomly set values to NaN based on mask_rate
- Support imputation: KNN imputation on training set only (test unchanged)
- Support caching: export/load masked datasets to/from CSV
- Unified `input()` method orchestrating all loading modes

## Implementation Details
- **Libraries**: kagglehub, pandas, numpy, sklearn.impute.KNNImputer, sklearn.model_selection.train_test_split
- **Location**: `lib/dataset/iris.py`
- **Features**: SepalLengthCm, SepalWidthCm, PetalLengthCm, PetalWidthCm
- **Target**: Species (Iris-setosa, Iris-versicolor, Iris-virginica)
- **Imputer**: KNNImputer(n_neighbors=5, weights="distance")
- **Output files**: `./output/iris_masked_{pct}_train.csv`, `./output/iris_masked_{pct}_test.csv`

### Methods
| Method | Description |
|--------|-------------|
| `_load_raw()` | Load raw data from Kaggle |
| `load()` | Load and split without masking |
| `load_masked(mask_rate, random_state)` | Load with random NaN masking |
| `load_from_csv(mask_rate)` | Load from cached CSV files |
| `_impute(X_train, X_test)` | KNN impute training set |
| `input(mask_rate, reuse_dataset, impute)` | Unified entry point |
| `export(X_train, X_test, y_train, y_test, mask_rate)` | Save to CSV |

## Related specs
- [lib/Dataset](Dataset.md) - Parent container
- [lib/Dataset-Income](Dataset-Income.md) - Similar pattern for Income data
