#!/usr/bin/env python3
"""Compare accuracy across training scripts with varying mask rates."""

import subprocess
import matplotlib.pyplot as plt

SCRIPTS = ["train-tree.py", "train-forest.py", "train-gradient-forest.py"]
MASK_VALUES = list(range(0, 95, 5))  # 0, 5, 10, ..., 90


def run_script(script, mask, impute=False, use_output=False):
    """Run a training script and return accuracy."""
    cmd = ["python", "-W", "ignore", script, "--accuracy-only"]

    if mask > 0:
        cmd.extend(["--mask", str(mask)])
        if impute:
            cmd.append("--impute")
        if use_output:
            cmd.extend(["--use-output", "true"])

    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return float(result.stdout.strip())
    except ValueError:
        print(f"Error: {script} mask={mask} impute={impute}: {result.stderr[:100]}")
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

    colors = {
        "tree": "forestgreen",
        "forest": "royalblue",
        "gradient-forest": "darkorange"
    }

    # Plot 1: Without impute variants
    fig, ax = plt.subplots(figsize=(12, 8))
    for name in ["tree", "forest", "gradient-forest"]:
        ax.plot(MASK_VALUES, results[name],
                label=name, color=colors[name], linewidth=2, marker="o")
    ax.set_xlabel("Mask %", fontsize=12)
    ax.set_ylabel("Accuracy", fontsize=12)
    ax.set_title("Model Accuracy vs Missing Data Rate", fontsize=14)
    ax.set_xlim(0, 90)
    ax.set_ylim(0, 1.05)
    ax.set_xticks(MASK_VALUES)
    ax.legend(loc="lower left", fontsize=10)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig("./output/accuracy_comparison.png", dpi=150)
    plt.close()
    print("Saved: ./output/accuracy_comparison.png")

    # Plot 2: With impute variants
    fig, ax = plt.subplots(figsize=(12, 8))
    for name in ["tree", "forest", "gradient-forest"]:
        ax.plot(MASK_VALUES, results[name],
                label=name, color=colors[name], linewidth=2, marker="o")
        ax.plot(MASK_VALUES, results[f"{name}_impute"],
                label=f"{name} (imputed)", color=colors[name], linewidth=2,
                linestyle="--", marker="s", alpha=0.7)
    ax.set_xlabel("Mask %", fontsize=12)
    ax.set_ylabel("Accuracy", fontsize=12)
    ax.set_title("Model Accuracy vs Missing Data Rate (with Imputation)", fontsize=14)
    ax.set_xlim(0, 90)
    ax.set_ylim(0, 1.05)
    ax.set_xticks(MASK_VALUES)
    ax.legend(loc="lower left", fontsize=10)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig("./output/accuracy_comparison_impute.png", dpi=150)
    plt.close()
    print("Saved: ./output/accuracy_comparison_impute.png")


if __name__ == "__main__":
    main()
