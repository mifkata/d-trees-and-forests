import argparse


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
        parser.add_argument("--dataset", type=str, choices=["Iris", "Income"], default="Iris",
                            help="Dataset to use (default: Iris)")
        args = parser.parse_args()

        # Add computed mask_rate
        args.mask_rate = args.mask / 100.0

        return args
