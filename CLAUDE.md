# D-trees and Random Forests

## Commands
- `/spec-apply`
- `/spec-editor` (skill)

## Stack
* Use `scikit-learn`, `pandas`, `numpy` to train and run models.
* Do not implement classification algorithms from scratch; use existing libraries.
* Use `pnpm` instead of `npm` for running Node.js applications and scripts.

## Specs
* Create specs in `specs/` directory following the Spec Editor skill guidelines.

## Git
* Never commit or push without being explicitly asked
* When asked to commit, push automatically unless told not to
* Do not commit author/co-author information
* Use conventional commit messages (e.g., `feat: add random forest training script`)

# Pull Requests
* Pushing a branch for the first time, should open a Draft PR automatically. Use `gh` CLI tool for GitHub operations.
* Automatically assign the current `gh` user to newly created PRs.
* PR description should include only information about specific changes with no actionable items.
* PR description should be updated when new commits are pushed, if a previously defined change was rolled back or modified, it should be only 1 record for the current state of a change (examples: deleted func(), restored func() in 2 commits should cleanup any reference to func() being changed, as it was rolled back to previous change; if a value was changed from 3 to 5 to 7, only 1 record for the change should be in the PR description - latest value: 7).
* Do not add any generation/co-authoring references in PR description.

## Makefile Commands
* `make setup` - Install Python and Node.js dependencies
* `make dev` - Start the frontend development server
* `make worktree <name>` - Create a git worktree at `./worktrees/<name>` with symlinks to `frontend/public/output` and `frontend/node_modules`
* `make worktree.rm <name>` - Remove worktree at `./worktrees/<name>`
* `make tree` / `make forest` / `make gradient` / `make hist-gradient` - Run training scripts
* `make compare` - Run comparison script

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
* `train-gradient.py` - Train a gradient boosted trees model using GradientBoostingClassifier (classic gradient boosting algorithm, requires imputation for missing values). Outputs accuracy, classification report, and model info. With `--images`: exports heatmap and clustering visualization.
* `train-hist-gradient.py` - Train a histogram-based gradient boosted trees model using HistGradientBoostingClassifier (XGBoost-style, natively supports missing values). Outputs accuracy, classification report, and model info. With `--images`: exports heatmap and clustering visualization.
