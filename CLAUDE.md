# D-trees and Random Forests

## Makefile

### Model Training

* `make tree` - Train decision tree model
* `make tree MASK=30` - Train with 30% masked data
* `make tree MASK=30 USE_OUTPUT=true` - Train using cached masked dataset
* `make forest` - Train random forest model
* `make forest MASK=30` - Train with 30% masked data
* `make forest MASK=30 USE_OUTPUT=true` - Train using cached masked dataset

### Devcontainer

* `make devcontainer.start` - Start the devcontainer
* `make devcontainer.stop` - Stop the devcontainer
* `make devcontainer.restart` - Restart the devcontainer
* `make devcontainer.build` - Build the devcontainer image
* `make devcontainer.rebuild` - Rebuild the devcontainer image (no cache)
* `make devcontainer.shell` - Start a shell session in the devcontainer

## Stack

* Use `tensorflow`, `scikit-learn`, `pandas`, `numpy` to train and run models.
* Do not implement classification algorithms from scratch; use existing libraries.

## Training scripts

Use 2/3 of the data for training and 1/3 for testing. Dataset should be Iris dataset via kagglehub `saurabh00007/iriscsv`.

### Parameters

* `--mask [PERCENT]` - Mask percentage for missing values (0-100). Defaults to 10 if flag present without value, 0 otherwise.
* `--dataset true|false` - If true, load dataset from `./output/iris_masked_XX_train.csv` and `./output/iris_masked_XX_test.csv`

### Output files

Files are named with mask percentage: `{name}_{mask_pct}.{ext}` (e.g., `forest_trees_30_2x2.png` for 30% mask)

### Scripts

* `train-tree.py` - Script to train a decision tree model. Outputs accuracy and classification report. Exports heatmap of feature correlations and tree visualization.
* `train-forest.py` - Script to train a random forest model. Outputs accuracy and classification report. Exports scaled heatmap of feature correlations.
* `train-gradient-forest.py` - Script to train a gradient boosting forest model.
