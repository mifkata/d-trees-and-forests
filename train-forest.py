import yaml
from sklearn.ensemble import RandomForestClassifier
from lib import Args, Dataset, Model, Render

args = Args.get_inputs()

# Select dataset
DataSource = Dataset.Iris if args.dataset == "Iris" else Dataset.Income

# Load model config
with open(f"config/forest-{args.dataset}.yml") as f:
    config = yaml.safe_load(f)

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

# Train random forest
clf = RandomForestClassifier(**config)
clf.fit(X_train, y_train)

# Predictions and evaluation
y_pred = clf.predict(X_test)
Model.report(y_test, y_pred, accuracy_only=args.accuracy_only, json_output=args.json)

if args.accuracy_only or args.json:
    exit(0)

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
