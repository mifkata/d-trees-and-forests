# Dataset.Income

## Overview
Loader for the Adult Income (Census) dataset with support for masking, imputation, and caching.

## Requirements
- Load Adult Income dataset from URL (yggdrasil-decision-forests repository)
- Encode categorical columns using LabelEncoder for sklearn compatibility
- Split data 2/3 train, 1/3 test with random_state=42
- Support masking: randomly set values to NaN based on mask_rate
- Support imputation: KNN imputation on training set only (test unchanged)
- Support caching: export/load masked datasets to/from CSV
- Unified `input()` method orchestrating all loading modes

## Implementation Details
- **Libraries**: pandas, numpy, sklearn.impute.KNNImputer, sklearn.model_selection.train_test_split, sklearn.preprocessing.LabelEncoder
- **Location**: `lib/dataset/income.py`
- **Data URL**: `https://raw.githubusercontent.com/google/yggdrasil-decision-forests/main/yggdrasil_decision_forests/test_data/dataset/adult.csv`
- **Features**: age, workclass, fnlwgt, education, education_num, marital_status, occupation, relationship, race, sex, capital_gain, capital_loss, hours_per_week, native_country
- **Target**: income (<=50K, >50K)
- **Imputer**: KNNImputer(n_neighbors=5, weights="distance")
- **Output files**: `./output/income_masked_{pct}_train.csv`, `./output/income_masked_{pct}_test.csv`

### Methods
| Method | Description |
|--------|-------------|
| `_load_raw()` | Load raw data from URL, encode categoricals |
| `load()` | Load and split without masking |
| `load_masked(mask_rate, random_state)` | Load with random NaN masking |
| `load_from_csv(mask_rate)` | Load from cached CSV files |
| `_impute(X_train, X_test)` | KNN impute training set |
| `input(mask_rate, reuse_dataset, impute)` | Unified entry point |
| `export(X_train, X_test, y_train, y_test, mask_rate)` | Save to CSV |

## Related specs
- [lib/Dataset](Dataset.md) - Parent container
- [lib/Dataset-Iris](Dataset-Iris.md) - Similar pattern for Iris data
