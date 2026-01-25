import argparse
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
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

# Train decision tree
clf = DecisionTreeClassifier(random_state=42)
clf.fit(X_train, y_train)

# Predictions and evaluation
y_pred = clf.predict(X_test)
Model.report(y_test, y_pred)

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

# Export decision boundaries
Dataset.Render.tree_boundaries(clf, X_train, y_train, X_train.columns.tolist())
