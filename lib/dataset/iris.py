import os
import kagglehub
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

OUTPUT_DIR = "./output"


class Iris:
    @staticmethod
    def _load_raw():
        """Load raw Iris dataset.

        Returns:
            tuple: (X, y) feature matrix and target series
        """
        path = kagglehub.dataset_download("saurabh00007/iriscsv")
        df = pd.read_csv(f"{path}/Iris.csv")

        X = df.drop(columns=["Id", "Species"])
        y = df["Species"]

        return X, y

    @staticmethod
    def load():
        """Load Iris dataset and return train/test splits.

        Returns:
            tuple: (X_train, X_test, y_train, y_test) with 2/3 train, 1/3 test split
        """
        X, y = Iris._load_raw()

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=1/3, random_state=42
        )

        return X_train, X_test, y_train, y_test

    @staticmethod
    def load_masked(mask_rate=0.1, random_state=42):
        """Load Iris dataset with missing data.

        Args:
            mask_rate: Fraction of values to set as missing (default 0.1)
            random_state: Random seed for reproducibility

        Returns:
            tuple: (X_train, X_test, y_train, y_test) with 2/3 train, 1/3 test split
        """
        X, y = Iris._load_raw()

        # Introduce missing values
        rng = np.random.default_rng(random_state)
        mask = rng.random(X.shape) < mask_rate
        X = X.mask(mask)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=1/3, random_state=42
        )

        return X_train, X_test, y_train, y_test

    @staticmethod
    def load_from_csv(mask_rate):
        """Load dataset from previously exported CSV files.

        Args:
            mask_rate: Mask rate used when exporting (0.0-1.0)

        Returns:
            tuple: (X_train, X_test, y_train, y_test)

        Raises:
            FileNotFoundError: If train or test CSV files don't exist
        """
        mask_pct = int(mask_rate * 100)
        train_path = f"{OUTPUT_DIR}/iris_masked_{mask_pct}_train.csv"
        test_path = f"{OUTPUT_DIR}/iris_masked_{mask_pct}_test.csv"

        if not os.path.exists(train_path):
            raise FileNotFoundError(f"Train dataset not found: {train_path}")
        if not os.path.exists(test_path):
            raise FileNotFoundError(f"Test dataset not found: {test_path}")

        train_df = pd.read_csv(train_path)
        test_df = pd.read_csv(test_path)

        X_train = train_df.drop(columns=["Species"])
        y_train = train_df["Species"]
        X_test = test_df.drop(columns=["Species"])
        y_test = test_df["Species"]

        print(f"Loaded: {train_path}")
        print(f"Loaded: {test_path}")

        return X_train, X_test, y_train, y_test

    @staticmethod
    def input(mask_rate=0.0, reuse_dataset=False):
        """Load Iris dataset based on input parameters.

        Args:
            mask_rate: Fraction of values to mask (0.0 = no masking)
            reuse_dataset: If True, load from previously exported CSV files

        Returns:
            tuple: (X_train, X_test, y_train, y_test) with 2/3 train, 1/3 test split
        """
        if reuse_dataset:
            return Iris.load_from_csv(mask_rate)
        if mask_rate > 0:
            return Iris.load_masked(mask_rate=mask_rate)
        return Iris.load()

    @staticmethod
    def export(X_train, X_test, y_train, y_test, mask_rate=0.0):
        """Export dataset to CSV files.

        Args:
            X_train, X_test: Feature DataFrames
            y_train, y_test: Target Series
            mask_rate: Mask rate for filename (0.0-1.0)
        """
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        mask_pct = int(mask_rate * 100)
        prefix = f"iris_masked_{mask_pct}"

        train_df = X_train.copy()
        train_df["Species"] = y_train.values
        train_df.to_csv(f"{OUTPUT_DIR}/{prefix}_train.csv", index=False)
        print(f"Saved: {OUTPUT_DIR}/{prefix}_train.csv")

        test_df = X_test.copy()
        test_df["Species"] = y_test.values
        test_df.to_csv(f"{OUTPUT_DIR}/{prefix}_test.csv", index=False)
        print(f"Saved: {OUTPUT_DIR}/{prefix}_test.csv")
