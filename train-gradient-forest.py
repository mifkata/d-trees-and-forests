import argparse
from sklearn.ensemble import GradientBoostingClassifier
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

# Train gradient boosting forest
clf = GradientBoostingClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Predictions and evaluation
y_pred = clf.predict(X_test)
Model.report(y_test, y_pred)

# Export feature importance visualization
Dataset.Render.forest_importance(
    clf,
    X_train.columns,
    filename="gradient_forest_feature_importance.png",
    color="darkorange",
    title="Gradient Boosting Feature Importance"
)

# Export staged training accuracy
Dataset.Render.gradient_forest_staged(clf, X_train, X_test, y_train, y_test)

# Export sample trees
Dataset.Render.gradient_forest_trees(clf, X_train.columns.tolist())
