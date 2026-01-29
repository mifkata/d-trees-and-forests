# Args

## Overview
Centralized argument parsing for all training scripts. Provides consistent CLI interface across models.

## Requirements
- Parse `--mask` as integer percentage (0-100), default 0, const 10 if flag present without value
- Parse `--use-output` as boolean string ("true"/"false"), default false
- Parse `--impute` as boolean flag, default false
- Parse `--images` as boolean flag, default false
- Parse `--json` as boolean flag, default false
- Parse `--dataset` as choice (Iris|Income), default "Iris"
- Parse `--model-config` as JSON string for model hyperparameter overrides
- Parse `--split` as integer percentage (10-90) for test set size, default 33
- Compute `mask_rate` as float (mask / 100.0)
- Compute `test_size` as float (split / 100.0)

## Implementation Details
- **Library**: argparse
- **Method**: `Args.get_inputs()` static method returns `argparse.Namespace`
- **Location**: `lib/args/__init__.py`

## Related specs
- [lib/Dataset](Dataset.md) - Uses mask_rate and dataset args
- [lib/Model](Model.md) - Uses json arg
