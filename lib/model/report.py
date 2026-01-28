import json as json_lib
import numpy as np
from sklearn.metrics import accuracy_score, classification_report


class NumpyEncoder(json_lib.JSONEncoder):
    """JSON encoder that handles numpy types."""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


def report(y_true, y_pred, accuracy_only=False, json_output=False, model_info=None):
    """Print accuracy and classification report.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        accuracy_only: If True, output only accuracy as quoted float
        json_output: If True, output summary as JSON
        model_info: Optional dict with additional model information for JSON output
    """
    accuracy = accuracy_score(y_true, y_pred)

    if accuracy_only:
        print(f"{accuracy:.4f}", end="")
        return

    if json_output:
        report_dict = classification_report(y_true, y_pred, output_dict=True)
        summary = {
            "accuracy": float(accuracy),
            "classification_report": report_dict
        }
        if model_info:
            summary["model_info"] = model_info
        print(json_lib.dumps(summary, indent=2, cls=NumpyEncoder))
        return

    print(f"Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred))
