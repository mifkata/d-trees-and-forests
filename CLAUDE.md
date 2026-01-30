# D-trees and Random Forests

## Commands
- `/spec-apply`
- `/spec-editor` (skill)

## Stack
* Use `scikit-learn`, `pandas`, `numpy` to train and run models.
* Do not implement classification algorithms from scratch; use existing libraries.

## Specs
* Create specs in `specs/` directory following the Spec Editor skill guidelines.

## Git
* Do not commit author/co-author information
* Use conventional commit messages (e.g., `feat: add random forest training script`)

## Training scripts
Use 2/3 of the data for training and 1/3 for testing. Dataset should be Iris dataset via kagglehub `saurabh00007/iriscsv`.

### Parameters
* `--mask [PERCENT]` - Mask percentage for missing values (0-100). Defaults to 10 if flag present without value, 0 otherwise.
* `--use-output true|false` - If true, load dataset from `./output/iris_masked_XX_train.csv` and `./output/iris_masked_XX_test.csv`
* `--impute` - Impute missing values in training set only (test set keeps missing values for realistic evaluation)
* `--images` - Generate plot images to `./output/`
* `--accuracy-only` - Output only accuracy as float (e.g., `0.9800`)
* `--json` - Output summary as JSON (accuracy and classification report)
* `--dataset Iris|Income` - Dataset to use (default: Iris)

### Output files

Files are named with mask percentage: `{name}_{mask_pct}.{ext}` (e.g., `forest_trees_30_2x2.png` for 30% mask)

### Scripts

* `train-tree.py` - Train a decision tree model. Outputs accuracy and classification report. With `--images`: exports heatmap, tree visualization, feature importance, and decision boundaries.
* `train-forest.py` - Train a random forest model. Outputs accuracy and classification report. With `--images`: exports feature importance, sample trees, PDP/ICE plots, OOB errors, and proximity matrix.
* `train-gradient-forest.py` - Train a gradient boosted trees model using HistGradientBoostingClassifier (decision tree ensemble with gradient boosting, natively supports missing values). Outputs accuracy, classification report, and model info. With `--images`: exports feature importance.
