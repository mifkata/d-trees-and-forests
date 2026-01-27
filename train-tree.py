import pandas as pd
import yaml
from sklearn.tree import DecisionTreeClassifier
from lib import Args, Dataset, Model

args = Args.get_inputs()

# Select dataset
DataSource = Dataset.Iris if args.dataset == "Iris" else Dataset.Income

# Load model config
with open(f"config/tree-{args.dataset}.yml") as f:
    config = yaml.safe_load(f)

# Set mask rate for render filenames
Dataset.Render.set_mask(args.mask_rate)

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
Model.report(y_test, y_pred, accuracy_only=args.accuracy_only)

if args.accuracy_only:
    exit(0)

if args.images:
    # Export heatmap of feature correlations
    Dataset.Render.heatmap(pd.concat([X_train, X_test]))

    # Export tree visualization
    Dataset.Render.tree(
        clf,
        feature_names=X_train.columns.tolist(),
        class_names=clf.classes_.tolist()
    )

    # Export feature importance
    Dataset.Render.tree_importance(clf, X_train.columns.tolist())

    # Export decision boundaries (only for small feature sets)
    if len(X_train.columns) <= 6:
        Dataset.Render.tree_boundaries(clf, X_train, y_train, X_train.columns.tolist())
