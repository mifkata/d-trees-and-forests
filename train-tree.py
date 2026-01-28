import pandas as pd
import yaml
from sklearn.tree import DecisionTreeClassifier
from lib import Args, Dataset, Model, Render
from lib.args import merge_config

args = Args.get_inputs()

# Select dataset
DataSource = Dataset.Iris if args.dataset == "Iris" else Dataset.Income

# Load model config (YAML base + CLI overrides)
with open(f"config/tree-{args.dataset}.yml") as f:
    config = merge_config(yaml.safe_load(f), args.model_config)

# Set mask rate for render filenames
Render.set_mask(args.mask_rate)

# Load dataset
X_train, X_test, y_train, y_test = DataSource.input(
    mask_rate=args.mask_rate,
    reuse_dataset=args.use_output,
    impute=args.impute
)

# Export masked dataset if generating new data with masking
if args.mask_rate > 0 and not args.use_output:
    DataSource.export(X_train, X_test, y_train, y_test, mask_rate=args.mask_rate)

# Train decision tree
clf = DecisionTreeClassifier(**config)
clf.fit(X_train, y_train)

# Predictions and evaluation
y_pred = clf.predict(X_test)
model_info = {
    "type": "tree",
    "treeDepth": clf.get_depth(),
    "nLeaves": clf.get_n_leaves()
}
Model.report(y_test, y_pred, accuracy_only=args.accuracy_only, json_output=args.json,
             model_info=model_info if args.json else None)

if args.accuracy_only or args.json:
    exit(0)

if args.images:
    # Export heatmap of feature correlations
    Render.heatmap(pd.concat([X_train, X_test]))

    # Export tree visualization
    Render.tree(
        clf,
        feature_names=X_train.columns.tolist(),
        class_names=clf.classes_.tolist()
    )

    # Export feature importance
    Render.tree_importance(clf, X_train.columns.tolist())

    # Export decision boundaries (only for small feature sets)
    if len(X_train.columns) <= 6:
        Render.tree_boundaries(clf, X_train, y_train, X_train.columns.tolist())
