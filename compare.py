#!/usr/bin/env python3
"""Compare accuracy across training scripts with varying mask rates."""

import json
import subprocess
from lib import Render

SCRIPTS = ["train-tree.py", "train-forest.py", "train-gradient-forest.py"]
MASK_VALUES = list(range(0, 95, 5))  # 0, 5, 10, ..., 90
COLORS = {
    "tree": "forestgreen",
    "forest": "royalblue",
    "gradient-forest": "darkorange"
}


def run_script(script, mask, impute=False, use_output=False):
    """Run a training script and return accuracy from JSON output."""
    cmd = ["python", "-W", "ignore", script, "--json"]

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


def main():
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
            acc = run_script(script, mask, impute=False, use_output=not first_script and mask > 0)
            results[name].append(acc)

            # With impute (only when mask > 0)
            if mask > 0:
                acc_impute = run_script(script, mask, impute=True, use_output=True)
                results[f"{name}_impute"].append(acc_impute)
            else:
                results[f"{name}_impute"].append(acc)  # Same as without impute for mask=0

            first_script = False

    # Generate comparison plots
    Render.compare_accuracy(MASK_VALUES, results, COLORS)
    Render.compare_accuracy_impute(MASK_VALUES, results, COLORS)


if __name__ == "__main__":
    main()
