import argparse
import json


def merge_config(yaml_config, json_config):
    """Merge JSON config overrides into YAML config.

    Args:
        yaml_config: Base config from YAML file
        json_config: JSON string with overrides (snake_case keys)

    Returns:
        Merged config dict
    """
    if not json_config:
        return yaml_config

    try:
        overrides = json.loads(json_config)
    except json.JSONDecodeError:
        return yaml_config

    merged = yaml_config.copy()
    merged.update(overrides)

    return merged


class Args:
    @staticmethod
    def get_inputs():
        """Parse common command line arguments for training scripts.

        Returns:
            argparse.Namespace with:
                - mask: int, mask percentage (0-100)
                - mask_rate: float, mask rate (0.0-1.0)
                - use_output: bool, reuse cached dataset
                - impute: bool, impute training missing values
                - images: bool, generate plot images
                - accuracy_only: bool, output only accuracy as float
                - json: bool, output summary as JSON
        """
        parser = argparse.ArgumentParser()
        parser.add_argument("--mask", type=int, nargs="?", const=10, default=0,
                            help="Mask percentage for missing values (default: 10 if flag present, 0 otherwise)")
        parser.add_argument("--use-output", type=lambda x: x.lower() == "true", default=False,
                            help="Reuse dataset from CSV files (true/false)")
        parser.add_argument("--impute", action="store_true",
                            help="Impute missing values in training set only")
        parser.add_argument("--images", action="store_true",
                            help="Generate plot images")
        parser.add_argument("--accuracy-only", action="store_true",
                            help="Output only accuracy as float")
        parser.add_argument("--json", action="store_true",
                            help="Output summary as JSON")
        parser.add_argument("--dataset", type=str, choices=["Iris", "Income"], default="Iris",
                            help="Dataset to use (default: Iris)")
        parser.add_argument("--model-config", type=str, default=None,
                            help="JSON string with model config overrides (camelCase keys)")
        args = parser.parse_args()

        # Add computed mask_rate
        args.mask_rate = args.mask / 100.0

        return args
