import argparse
from sklearn.ensemble import RandomForestClassifier
from lib import Dataset, Model

parser = argparse.ArgumentParser()
parser.add_argument("--mask", type=int, nargs="?", const=10, default=0,
                    help="Mask percentage for missing values (default: 10 if flag present, 0 otherwise)")
parser.add_argument("--use-output", type=lambda x: x.lower() == "true", default=False,
                    help="Reuse dataset from CSV files (true/false)")
args = parser.parse_args()

# Convert mask percentage to rate
mask_rate = args.mask / 100.0

# Set mask rate for render filenames
Dataset.Render.set_mask(mask_rate)

# Load dataset
X_train, X_test, y_train, y_test = Dataset.Iris.input(
    mask_rate=mask_rate,
    reuse_dataset=args.use_output
)

# Export masked dataset if generating new data with masking
if mask_rate > 0 and not args.use_output:
    Dataset.Iris.export(X_train, X_test, y_train, y_test, mask_rate=mask_rate)

# Train random forest
clf = RandomForestClassifier(n_estimators=100, random_state=42, oob_score=True)
clf.fit(X_train, y_train)

# Predictions and evaluation
y_pred = clf.predict(X_test)
Model.report(y_test, y_pred)

# Export feature importance visualization
Dataset.Render.forest_importance(clf, X_train.columns)

# Export sample trees from the forest
Dataset.Render.forest_trees(
    clf,
    feature_names=X_train.columns.tolist(),
    class_names=clf.classes_.tolist()
)

# Export PDP and ICE for each class
for cls_name in clf.classes_:
    Dataset.Render.forest_pdp(clf, X_train, X_train.columns.tolist(),
                               filename=f"forest_pdp_{cls_name}.png", target=cls_name)
    Dataset.Render.forest_ice(clf, X_train, X_train.columns.tolist(),
                               filename=f"forest_ice_{cls_name}.png", target=cls_name)

# Export OOB errors
Dataset.Render.forest_oob(clf)

# Export proximity matrix
Dataset.Render.forest_proximity(clf, X_train)
