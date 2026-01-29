import yaml
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from lib import Args, Dataset, Model, Render
from lib.args import merge_config

args = Args.get_inputs()

# Select dataset
DataSource = Dataset.Iris if args.dataset == "Iris" else Dataset.Income

# Load model config (YAML base + CLI overrides)
with open(f"config/gradient-{args.dataset}.yml") as f:
    config = merge_config(yaml.safe_load(f), args.model_config)

# Set mask rate for render filenames
Render.set_mask(args.mask_rate)

# Load dataset
# HistGradientBoostingClassifier natively supports missing values
X_train, X_test, y_train, y_test = DataSource.input(
    mask_rate=args.mask_rate,
    test_size=args.test_size,
    reuse_dataset=args.use_output,
    impute=args.impute,
    ignore_columns=args.ignore_columns
)

# Export masked dataset if generating new data with masking
if args.mask_rate > 0 and not args.use_output:
    DataSource.export(X_train, X_test, y_train, y_test, mask_rate=args.mask_rate)

# Train histogram-based gradient boosting (decision tree ensemble with gradient boosting)
# HistGradientBoostingClassifier natively supports missing values
clf = HistGradientBoostingClassifier(**config)
clf.fit(X_train, y_train)

# Predictions and evaluation
y_pred = clf.predict(X_test)
model_info = {
    "type": "gradient",
    "n_iterations": clf.n_iter_
}

# Feature importance using permutation importance
perm_importance = permutation_importance(clf, X_test, y_test, n_repeats=10, random_state=42)
feature_importance = dict(zip(X_train.columns.tolist(), perm_importance.importances_mean.tolist()))

# Build params for JSON output
params = {
    "dataset": args.dataset,
    "mask": args.mask,
    "split": args.split,
    "impute": args.impute,
    "ignore_columns": args.ignore_columns,
    "model_config": config
}

Model.report(
    y_test, y_pred,
    json_output=args.json,
    model_info=model_info if args.json else None,
    params=params if args.json else None,
    feature_importance=feature_importance if args.json else None,
    X_train=X_train if args.json else None,
    X_test=X_test if args.json else None,
    y_train=y_train if args.json else None,
    y_test=y_test if args.json else None
)

if args.images:
    # Export feature importance visualization using permutation importance
    Render.gradient_forest_importance(
        perm_importance.importances_mean,
        X_train.columns.tolist(),
        filename="gradient_forest_feature_importance.png"
    )
