#!/usr/bin/env python3
"""Compare accuracy across training scripts with varying mask rates."""

import argparse
import json
import os
import subprocess
import sys
from lib import Render

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
    "gradient": "gradient-forest"
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


def run_script(script, mask, impute=False, use_output=False, run_id=None, dataset="Iris"):
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
        print(f"Error: {script} mask={mask} impute={impute}: {e}")
        if result.stderr:
            print(f"  stderr: {result.stderr[:100]}")
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

    # If model IDs provided, validate them
    if has_model_ids:
        for arg_name, run_id in model_ids.items():
            if run_id is not None:
                expected_model = MODEL_TYPE_MAP[arg_name]
                validate_model_id(run_id, expected_model, args.dataset)
                print(f"Validated {arg_name} model: {run_id}")

        # TODO: Implement loading pre-trained models and comparing them
        print("\nModel ID mode not yet fully implemented.")
        print("Validated models can be loaded from:")
        for arg_name, run_id in model_ids.items():
            if run_id is not None:
                print(f"  {arg_name}: {get_output_dir(run_id)}/model.pkl")
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
