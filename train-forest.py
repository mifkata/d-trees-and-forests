import yaml
from sklearn.ensemble import RandomForestClassifier
from lib import Args, Dataset, Model, Render
from lib.args import merge_config

args = Args.get_inputs()

# Select dataset
DataSource = Dataset.Iris if args.dataset == "Iris" else Dataset.Income

# Load model config (YAML base + CLI overrides)
with open(f"config/forest-{args.dataset}.yml") as f:
    config = merge_config(yaml.safe_load(f), args.model_config)

# Set mask rate and run_id for render filenames
Render.set_mask(args.mask_rate)
if args.run_id:
    Render.set_run_id(args.run_id)

# Load dataset
X_train, X_test, y_train, y_test = DataSource.input(
    mask_rate=args.mask_rate,
    test_size=args.test_size,
    reuse_dataset=args.use_output,
    impute=args.impute,
    ignore_columns=args.ignore_columns
)

# Export dataset if run_id provided or generating new masked data
if args.run_id:
    DataSource.export(X_train, X_test, y_train, y_test, mask_rate=args.mask_rate, run_id=args.run_id)
elif args.mask_rate > 0 and not args.use_output:
    DataSource.export(X_train, X_test, y_train, y_test, mask_rate=args.mask_rate)

# Train random forest
clf = RandomForestClassifier(**config)
clf.fit(X_train, y_train)

# Predictions and evaluation
y_pred = clf.predict(X_test)
accuracy = (y_pred == y_test).mean()

# Save model and runtime config if run_id provided
if args.run_id:
    Model.save(clf, args.run_id)
    Model.save_runtime(
        run_id=args.run_id,
        dataset=args.dataset,
        model="forest",
        dataset_params={
            "mask": args.mask,
            "split": args.split,
            "impute": args.impute,
            "ignore_columns": args.ignore_columns,
            "use_output": args.use_output,
            "images": args.images
        },
        model_params=config
    )
    Model.save_id(args.run_id, "forest", args.dataset, accuracy)
model_info = {
    "type": "forest",
    "n_estimators": clf.n_estimators
}
if hasattr(clf, 'oob_score_'):
    model_info["oob_score"] = clf.oob_score_

# Feature importance
feature_importance = dict(zip(X_train.columns.tolist(), clf.feature_importances_.tolist()))

# Build params for JSON output
params = {
    "dataset": args.dataset,
    "mask": args.mask,
    "split": args.split,
    "impute": args.impute,
    "ignore_columns": args.ignore_columns,
    "run_id": args.run_id,
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
    # Export feature importance visualization
    Render.forest_importance(clf, X_train.columns)

    # Export sample trees from the forest
    Render.forest_trees(
        clf,
        feature_names=X_train.columns.tolist(),
        class_names=clf.classes_.tolist()
    )

    # Export PDP and ICE for each class (only for small feature sets)
    if len(X_train.columns) <= 6:
        for cls_name in clf.classes_:
            Render.forest_pdp(clf, X_train, X_train.columns.tolist(),
                                       filename=f"forest_pdp_{cls_name}.png", target=cls_name)
            Render.forest_ice(clf, X_train, X_train.columns.tolist(),
                                       filename=f"forest_ice_{cls_name}.png", target=cls_name)

    # Export OOB errors
    if hasattr(clf, 'oob_score_'):
        Render.forest_oob(clf)

    # Export proximity matrix (only for small datasets)
    if len(X_train) <= 500:
        Render.forest_proximity(clf, X_train)
