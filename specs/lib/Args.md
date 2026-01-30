# Args

## Overview
Centralized argument parsing for all training scripts. Provides consistent CLI interface across models.

## Requirements
- Parse `--mask` as integer percentage (0-100), default 0, const 10 if flag present without value
- Parse `--split` as integer percentage (10-90) for test set size, default 33
- Parse `--use-output` as boolean string ("true"/"false"), default false
- Parse `--impute` as boolean flag, default false
- Parse `--images` as boolean flag, default false
- Parse `--json` as boolean flag, default false
- Parse `--dataset` as choice (Iris|Income), default "Iris"
- Parse `--model-config` as JSON string for model hyperparameter overrides
- Parse `--dataset-ignore-columns` as comma-separated list of column indices to drop (e.g., "0,2" drops first and third columns)
- Parse `--run-id` as string identifier for the training run (used for output directory)
- Compute `mask_rate` as float (mask / 100.0)
- Compute `test_size` as float (split / 100.0)
- Compute `ignore_columns` as list of integers from comma-separated string

## Implementation Details
- **Library**: argparse
- **Method**: `Args.get_inputs()` static method returns `argparse.Namespace`
- **Location**: `lib/args/__init__.py`

### --dataset-ignore-columns
Accepts a comma-separated list of zero-based column indices to exclude from the dataset before training.

Examples:
- `--dataset-ignore-columns 0` - Drop first column
- `--dataset-ignore-columns 0,1` - Drop first two columns
- `--dataset-ignore-columns 0,2,4` - Drop first, third, and fifth columns

The columns are dropped after loading but before train/test split.

## Related specs
- [lib/Dataset](Dataset.md) - Uses mask_rate, test_size, and ignore_columns args
- [lib/Model](Model.md) - Uses json arg
