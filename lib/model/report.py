import json as json_lib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report


def convert_nan_to_none(obj):
    """Recursively convert NaN values to None in nested structures."""
    if isinstance(obj, dict):
        return {k: convert_nan_to_none(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_nan_to_none(v) for v in obj]
    if isinstance(obj, float) and np.isnan(obj):
        return None
    return obj


class NumpyEncoder(json_lib.JSONEncoder):
    """JSON encoder that handles numpy types and converts NaN to null."""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            value = float(obj)
            return None if np.isnan(value) else value
        if isinstance(obj, np.ndarray):
            return [None if isinstance(v, float) and np.isnan(v) else v for v in obj.tolist()]
        if isinstance(obj, pd.DataFrame):
            return obj.where(pd.notna(obj), None).to_dict(orient='records')
        if isinstance(obj, pd.Series):
            return [None if pd.isna(v) else v for v in obj.tolist()]
        return super().default(obj)


def report(y_true, y_pred, json_output=False, model_info=None, params=None,
           feature_importance=None, X_train=None, X_test=None, y_train=None, y_test=None):
    """Print accuracy and classification report.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        json_output: If True, output comprehensive JSON summary
        model_info: Optional dict with model information
        params: Optional dict with input parameters
        feature_importance: Optional dict mapping feature names to importance scores
        X_train: Optional training features DataFrame
        X_test: Optional test features DataFrame
        y_train: Optional training labels
        y_test: Optional test labels
    """
    accuracy = accuracy_score(y_true, y_pred)

    if json_output:
        report_dict = classification_report(y_true, y_pred, output_dict=True)
        summary = {
            "accuracy": float(accuracy),
            "classification_report": report_dict
        }

        if params:
            summary["params"] = params

        if model_info:
            summary["model_info"] = model_info

        if feature_importance is not None:
            summary["feature_importance"] = feature_importance

        if X_train is not None:
            summary["train_data"] = X_train.to_dict(orient='records')
            summary["feature_names"] = X_train.columns.tolist()

        if X_test is not None:
            summary["test_data"] = X_test.to_dict(orient='records')

        if y_train is not None:
            summary["train_labels"] = y_train.tolist() if hasattr(y_train, 'tolist') else list(y_train)

        if y_test is not None:
            summary["test_labels"] = y_test.tolist() if hasattr(y_test, 'tolist') else list(y_test)

        # Convert any remaining NaN values to None
        summary = convert_nan_to_none(summary)
        print(json_lib.dumps(summary, indent=2, cls=NumpyEncoder))
        return

    print(f"Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred))
