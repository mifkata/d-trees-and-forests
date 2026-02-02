import json as json_lib
import os
import numpy as np
import pandas as pd
import joblib
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
        params: Optional dict with input parameters (should include run_id)
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
        json_str = json_lib.dumps(summary, indent=2, cls=NumpyEncoder)

        # Save result.json if run_id is provided
        run_id = params.get('run_id') if params else None
        if run_id:
            output_dir = _get_output_dir(run_id)
            os.makedirs(output_dir, exist_ok=True)
            result_path = os.path.join(output_dir, 'result.json')
            with open(result_path, 'w') as f:
                f.write(json_str)

        print(json_str)
        return

    print(f"Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred))


def _get_output_dir(run_id):
    """Get the output directory path for a run_id.

    Args:
        run_id: Run identifier

    Returns:
        Full path to output directory
    """
    return os.path.realpath(os.path.join(
        os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'output', run_id
    ))


def save(clf, run_id):
    """Save fitted model to model.pkl.

    Args:
        clf: Fitted sklearn classifier
        run_id: Run identifier for output directory
    """
    if not run_id:
        return

    output_dir = _get_output_dir(run_id)
    os.makedirs(output_dir, exist_ok=True)

    model_path = os.path.join(output_dir, 'model.pkl')
    joblib.dump(clf, model_path)


def save_runtime(run_id, dataset, model, dataset_params, model_params):
    """Save runtime configuration to runtime.json.

    Args:
        run_id: Run identifier
        dataset: Dataset name (Iris/Income)
        model: Model type (tree/forest/gradient)
        dataset_params: Dict with dataset parameters (mask, split, impute, etc.)
        model_params: Dict with model hyperparameters
    """
    if not run_id:
        return

    output_dir = _get_output_dir(run_id)
    os.makedirs(output_dir, exist_ok=True)

    runtime = {
        "run_id": run_id,
        "dataset": dataset,
        "model": model,
        "datasetParams": dataset_params,
        "modelParams": model_params
    }

    runtime_path = os.path.join(output_dir, 'runtime.json')
    with open(runtime_path, 'w') as f:
        json_lib.dump(runtime, f, indent=2, cls=NumpyEncoder)


def save_id(run_id, model, dataset, accuracy):
    """Save empty .id marker file with model/dataset/score in filename.

    Args:
        run_id: Run identifier
        model: Model type (tree/forest/gradient)
        dataset: Dataset name (Iris/Income)
        accuracy: Accuracy score as float (0.0-1.0)
    """
    if not run_id:
        return

    output_dir = _get_output_dir(run_id)
    os.makedirs(output_dir, exist_ok=True)

    # Convert accuracy to 6-digit zero-padded integer
    score_int = int(accuracy * 1_000_000)
    score_str = f"{score_int:06d}"

    id_filename = f"{model}_{dataset}_{score_str}.id"
    id_path = os.path.join(output_dir, id_filename)

    # Create empty file
    with open(id_path, 'w') as f:
        pass
