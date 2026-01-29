import os
import kagglehub
import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from config import OUTPUT_DIR


class Income:
    _label_encoders = {}

    @staticmethod
    def _load_raw():
        """Load raw Adult Income dataset via kagglehub.

        Returns:
            tuple: (X, y) feature matrix and target series
        """
        path = kagglehub.dataset_download("uciml/adult-census-income")
        df = pd.read_csv(f"{path}/adult.csv")

        # Target column
        y = df["income"]

        # Feature columns (drop target)
        X = df.drop(columns=["income"])

        # Encode categorical columns for sklearn compatibility
        categorical_cols = X.select_dtypes(include=["object"]).columns
        Income._label_encoders = {}

        for col in categorical_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            Income._label_encoders[col] = le

        return X, y

    @staticmethod
    def load(test_size=0.33):
        """Load Income dataset and return train/test splits.

        Args:
            test_size: Fraction of data for test set (default 0.33)

        Returns:
            tuple: (X_train, X_test, y_train, y_test)
        """
        X, y = Income._load_raw()

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        return X_train, X_test, y_train, y_test

    @staticmethod
    def load_masked(mask_rate=0.1, test_size=0.33, random_state=42):
        """Load Income dataset with missing data.

        Args:
            mask_rate: Fraction of values to set as missing (default 0.1)
            test_size: Fraction of data for test set (default 0.33)
            random_state: Random seed for reproducibility

        Returns:
            tuple: (X_train, X_test, y_train, y_test)
        """
        X, y = Income._load_raw()

        # Introduce missing values
        rng = np.random.default_rng(random_state)
        mask = rng.random(X.shape) < mask_rate
        X = X.mask(mask)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
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
        train_path = f"{OUTPUT_DIR}/income_masked_{mask_pct}_train.csv"
        test_path = f"{OUTPUT_DIR}/income_masked_{mask_pct}_test.csv"

        if not os.path.exists(train_path):
            raise FileNotFoundError(f"Train dataset not found: {train_path}")
        if not os.path.exists(test_path):
            raise FileNotFoundError(f"Test dataset not found: {test_path}")

        train_df = pd.read_csv(train_path)
        test_df = pd.read_csv(test_path)

        X_train = train_df.drop(columns=["income"])
        y_train = train_df["income"]
        X_test = test_df.drop(columns=["income"])
        y_test = test_df["income"]

        return X_train, X_test, y_train, y_test

    @staticmethod
    def _impute(X_train, X_test):
        """Impute missing values in training data using KNN.

        Args:
            X_train: Training feature DataFrame with potential NaN values
            X_test: Test feature DataFrame with potential NaN values

        Returns:
            tuple: (X_train_imputed, X_test) - train imputed, test unchanged
        """
        imputer = KNNImputer(n_neighbors=5, weights="distance")
        columns = X_train.columns

        X_train_imputed = pd.DataFrame(
            imputer.fit_transform(X_train),
            columns=columns,
            index=X_train.index
        )

        return X_train_imputed, X_test

    @staticmethod
    def input(mask_rate=0.0, test_size=0.33, reuse_dataset=False, impute=False):
        """Load Income dataset based on input parameters.

        Args:
            mask_rate: Fraction of values to mask (0.0 = no masking)
            test_size: Fraction of data for test set (default 0.33)
            reuse_dataset: If True, load from previously exported CSV files
            impute: If True, impute missing values in training set only

        Returns:
            tuple: (X_train, X_test, y_train, y_test)
        """
        if reuse_dataset:
            X_train, X_test, y_train, y_test = Income.load_from_csv(mask_rate)
        elif mask_rate > 0:
            X_train, X_test, y_train, y_test = Income.load_masked(mask_rate=mask_rate, test_size=test_size)
        else:
            return Income.load(test_size=test_size)

        # Impute missing values in training set if impute is enabled
        if impute:
            X_train, X_test = Income._impute(X_train, X_test)

        return X_train, X_test, y_train, y_test

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
        prefix = f"income_masked_{mask_pct}"

        train_df = X_train.copy()
        train_df["income"] = y_train.values
        train_df.to_csv(f"{OUTPUT_DIR}/{prefix}_train.csv", index=False)

        test_df = X_test.copy()
        test_df["income"] = y_test.values
        test_df.to_csv(f"{OUTPUT_DIR}/{prefix}_test.csv", index=False)
