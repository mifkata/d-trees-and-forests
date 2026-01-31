#!/usr/bin/env python3
"""Compare accuracy across training scripts with varying mask rates."""

import argparse
import json
import os
import subprocess
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer

from lib import Dataset, Render

SCRIPTS = ["train-tree.py", "train-forest.py", "train-gradient-forest.py"]
MASK_VALUES = list(range(0, 95, 5))  # 0, 5, 10, ..., 90
COLORS = {
    "tree": "forestgreen",
    "forest": "royalblue",
    "gradient-forest": "darkorange"
}

# Mapping from CLI arg to expected model type in runtime.json
MODEL_TYPE_MAP = {
    "tree": "tree",
    "forest": "forest",
    "gradient": "gradient"
}


def get_output_dir(run_id):
    """Get the output directory path for a run_id."""
    return os.path.realpath(os.path.join(
        os.path.dirname(__file__), 'frontend', 'public', 'output', run_id
    ))


def validate_model_id(run_id, expected_model, expected_dataset):
    """Validate a model run ID against expected model type and dataset.

    Args:
        run_id: Run identifier
        expected_model: Expected model type (tree, forest, gradient-forest)
        expected_dataset: Expected dataset name (Iris, Income)

    Returns:
        True if valid

    Raises:
        SystemExit if validation fails
    """
    output_dir = get_output_dir(run_id)

    # Check model.pkl exists
    model_path = os.path.join(output_dir, 'model.pkl')
    if not os.path.exists(model_path):
        print(f"Error: model.pkl not found at {model_path}")
        sys.exit(1)

    # Check runtime.json exists
    runtime_path = os.path.join(output_dir, 'runtime.json')
    if not os.path.exists(runtime_path):
        print(f"Error: runtime.json not found at {runtime_path}")
        sys.exit(1)

    # Load and validate runtime.json
    with open(runtime_path) as f:
        runtime = json.load(f)

    # Validate dataset
    if runtime.get('dataset') != expected_dataset:
        print(f"Error: Dataset mismatch for run {run_id}")
        print(f"  Expected: {expected_dataset}")
        print(f"  Found: {runtime.get('dataset')}")
        sys.exit(1)

    # Validate model type
    if runtime.get('model') != expected_model:
        print(f"Error: Model type mismatch for run {run_id}")
        print(f"  Expected: {expected_model}")
        print(f"  Found: {runtime.get('model')}")
        sys.exit(1)

    return True


def load_full_dataset(dataset_name, mask_rate=0.0, impute=False, ignore_columns=None):
    """Load the full dataset without train/test split.

    Args:
        dataset_name: Dataset name (Iris or Income)
        mask_rate: Fraction of values to mask (0.0-1.0)
        impute: If True, impute missing values
        ignore_columns: List of column indices to drop

    Returns:
        tuple: (X, y) feature matrix and target series
    """
    # Get dataset class
    dataset_cls = getattr(Dataset, dataset_name)

    # Load raw dataset
    X, y = dataset_cls._load_raw()

    # Apply masking if needed
    if mask_rate > 0:
        rng = np.random.default_rng(42)
        mask = rng.random(X.shape) < mask_rate
        X = X.mask(mask)

    # Drop ignored columns
    if ignore_columns:
        cols_to_drop = [X.columns[i] for i in ignore_columns if i < len(X.columns)]
        X = X.drop(columns=cols_to_drop)

    # Impute missing values if needed
    if impute and X.isna().any().any():
        imputer = KNNImputer(n_neighbors=5, weights="distance")
        X = pd.DataFrame(
            imputer.fit_transform(X),
            columns=X.columns,
            index=X.index
        )

    return X, y


def evaluate_model(model_path, X, y):
    """Load a model and evaluate it on the given data.

    Args:
        model_path: Path to the model pkl file
        X: Feature matrix
        y: Target series

    Returns:
        float: Accuracy score
    """
    model = joblib.load(model_path)
    y_pred = model.predict(X)
    accuracy = (y_pred == y).mean()
    return accuracy


def run_script(script, mask, impute=False, use_output=False, run_id=None, dataset="Iris", ignore_columns=None):
    """Run a training script and return accuracy from JSON output."""
    cmd = ["python", "-W", "ignore", script, "--json", "--dataset", dataset]

    if run_id:
        cmd.extend(["--run-id", run_id])

    if mask > 0:
        cmd.extend(["--mask", str(mask)])
        if impute:
            cmd.append("--impute")
        if use_output:
            cmd.extend(["--use-output", "true"])

    if ignore_columns:
        cmd.extend(["--ignore-columns", ignore_columns])

    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        # Extract JSON from stdout (may contain warnings before JSON)
        stdout = result.stdout
        json_start = stdout.find("{")
        json_end = stdout.rfind("}") + 1
        if json_start == -1 or json_end == 0:
            raise ValueError("No JSON found in output")
        output = json.loads(stdout[json_start:json_end])
        return output["accuracy"]
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"Error: {script} mask={mask} impute={impute}: {e}", file=sys.stderr)
        if result.stderr:
            print(f"  stderr: {result.stderr[:100]}", file=sys.stderr)
        return None


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Compare accuracy across training scripts with varying mask rates"
    )
    parser.add_argument("--dataset", type=str, choices=["Iris", "Income"], default="Iris",
                        help="Dataset to use (default: Iris)")
    parser.add_argument("--tree", type=str, default=None,
                        help="Run ID for decision tree model")
    parser.add_argument("--forest", type=str, default=None,
                        help="Run ID for random forest model")
    parser.add_argument("--gradient", type=str, default=None,
                        help="Run ID for gradient boosted model")
    parser.add_argument("--mask", type=int, default=0,
                        help="Mask percentage for comparison (0-100)")
    parser.add_argument("--impute", action="store_true",
                        help="Impute missing values during comparison")
    parser.add_argument("--ignore-columns", type=str, default=None,
                        help="Comma-separated column indices to ignore")
    return parser.parse_args()


def main():
    args = parse_args()

    # Check if any model IDs provided
    model_ids = {
        "tree": args.tree,
        "forest": args.forest,
        "gradient": args.gradient
    }
    has_model_ids = any(v is not None for v in model_ids.values())

    # If model IDs provided, validate and run comparison
    if has_model_ids:
        # All three model IDs are required for comparison mode
        if not all(v is not None for v in model_ids.values()):
            print("Error: All three model IDs (--tree, --forest, --gradient) are required")
            sys.exit(1)

        # Validate all model IDs
        for arg_name, run_id in model_ids.items():
            expected_model = MODEL_TYPE_MAP[arg_name]
            validate_model_id(run_id, expected_model, args.dataset)
            print(f"Validated {arg_name} model: {run_id}", file=sys.stderr)

        print(f"\nRunning comparison with mask={args.mask}%, impute={args.impute}", file=sys.stderr)

        # Parse ignore_columns from comma-separated string
        ignore_columns = None
        if args.ignore_columns:
            ignore_columns = [int(x.strip()) for x in args.ignore_columns.split(',')]

        # Load the full dataset once (no train/test split)
        try:
            X, y = load_full_dataset(
                args.dataset,
                mask_rate=args.mask / 100.0,
                impute=args.impute,
                ignore_columns=ignore_columns
            )
            print(f"  Loaded {len(X)} samples from {args.dataset} dataset", file=sys.stderr)
        except Exception as e:
            print(json.dumps({
                "success": False,
                "error": {
                    "message": f"Failed to load dataset: {e}",
                    "details": str(e)
                }
            }))
            sys.exit(1)

        results = {}
        errors = []

        for arg_name, run_id in model_ids.items():
            output_dir = get_output_dir(run_id)

            # Get original training accuracy from result.json (most reliable source)
            train_accuracy = None
            result_path = os.path.join(output_dir, 'result.json')
            try:
                if os.path.exists(result_path):
                    with open(result_path) as f:
                        result_data = json.load(f)
                    train_accuracy = result_data.get('accuracy')
            except (json.JSONDecodeError, OSError) as e:
                print(f"  Warning: Could not read result.json for {arg_name}: {e}", file=sys.stderr)

            # Fallback: try parsing from .id filename if result.json failed
            if train_accuracy is None:
                try:
                    for filename in os.listdir(output_dir):
                        if filename.endswith('.id'):
                            # Parse accuracy from filename: {model}_{dataset}_{score}[_{name}].id
                            # Score is always the 3rd part (index 2)
                            parts = filename.replace('.id', '').split('_')
                            score_str = parts[2]  # Score is always index 2
                            train_accuracy = int(score_str) / 1000000
                            break  # Use first .id file found
                except (FileNotFoundError, ValueError, IndexError, OSError) as e:
                    errors.append(f"{arg_name}: failed to read training accuracy - {e}")

            # Load and evaluate the model on the full dataset
            model_path = os.path.join(output_dir, 'model.pkl')
            try:
                compare_accuracy = evaluate_model(model_path, X, y)
            except Exception as e:
                error_msg = f"{arg_name}: failed to evaluate model - {e}"
                print(f"  {error_msg}", file=sys.stderr)
                errors.append(error_msg)
                compare_accuracy = None

            results[arg_name] = {
                "runId": run_id,
                "trainAccuracy": train_accuracy,
                "compareAccuracy": compare_accuracy
            }

            if compare_accuracy is not None and train_accuracy is not None:
                ratio = compare_accuracy / train_accuracy
                print(f"  {arg_name}: train={train_accuracy:.4f}, compare={compare_accuracy:.4f}, ratio={ratio:.4f}", file=sys.stderr)
            else:
                print(f"  {arg_name}: error", file=sys.stderr)

        # Check if any model failed
        if errors:
            print(json.dumps({
                "success": False,
                "error": {
                    "message": "One or more models failed to evaluate",
                    "details": "\n".join(errors)
                }
            }))
            sys.exit(1)

        # Output results as JSON
        print(json.dumps({
            "success": True,
            "models": results
        }))
        return

    # Original comparison mode: run fresh training
    results = {}

    for script in SCRIPTS:
        name = script.replace("train-", "").replace(".py", "")
        results[f"{name}"] = []
        results[f"{name}_impute"] = []

    for mask in MASK_VALUES:
        print(f"Running mask={mask}%...")

        # First script generates dataset (USE_OUTPUT=false)
        first_script = True

        for script in SCRIPTS:
            name = script.replace("train-", "").replace(".py", "")

            # Without impute
            acc = run_script(script, mask, impute=False,
                             use_output=not first_script and mask > 0,
                             dataset=args.dataset)
            results[name].append(acc)

            # With impute (only when mask > 0)
            if mask > 0:
                acc_impute = run_script(script, mask, impute=True, use_output=True,
                                        dataset=args.dataset)
                results[f"{name}_impute"].append(acc_impute)
            else:
                results[f"{name}_impute"].append(acc)  # Same as without impute for mask=0

            first_script = False

    # Generate comparison plots
    Render.compare_accuracy(MASK_VALUES, results, COLORS)
    Render.compare_accuracy_impute(MASK_VALUES, results, COLORS)


if __name__ == "__main__":
    main()
