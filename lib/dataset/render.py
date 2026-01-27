import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from sklearn.tree import plot_tree
from sklearn.metrics import accuracy_score
from sklearn.inspection import PartialDependenceDisplay, DecisionBoundaryDisplay
from sklearn.preprocessing import LabelEncoder
from itertools import combinations

OUTPUT_DIR = "./output"


class Render:
    _fig = None
    _axes = None
    _mask_pct = 0

    @classmethod
    def set_mask(cls, mask_rate):
        """Set the mask rate for filename prefixes.

        Args:
            mask_rate: Mask rate (0.0-1.0)
        """
        cls._mask_pct = int(mask_rate * 100)

    @classmethod
    def _filename(cls, name):
        """Build output path and ensure directory exists.

        Args:
            name: Base filename

        Returns:
            Full path to output file with mask prefix
        """
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        # Insert mask percentage into filename before extension
        base, ext = os.path.splitext(name)
        prefixed_name = f"{base}_{cls._mask_pct}{ext}"
        return os.path.join(OUTPUT_DIR, prefixed_name)

    @classmethod
    def header(cls, figsize=(10, 8), subplots=None):
        """Standard plot setup.

        Args:
            figsize: Tuple of (width, height) for the figure
            subplots: Optional tuple of (rows, cols) for subplot grid
        """
        if subplots:
            cls._fig, cls._axes = plt.subplots(
                subplots[0], subplots[1], figsize=figsize
            )
        else:
            cls._fig = plt.figure(figsize=figsize)
            cls._axes = None
        return cls._fig, cls._axes

    @classmethod
    def footer(cls, filename, title=None, dpi=150):
        """Standard plot teardown - add title, save, and close.

        Args:
            filename: Output filename for the plot
            title: Optional suptitle for the figure
            dpi: Resolution for saved image
        """
        filepath = cls._filename(filename)
        if title:
            plt.suptitle(title, fontsize=14)
        plt.tight_layout()
        plt.savefig(filepath, dpi=dpi)
        plt.close()
        print(f"Saved: {filepath}")
        cls._fig = None
        cls._axes = None

    @classmethod
    def heatmap(cls, X, filename="feature_correlation_heatmap.png"):
        """Render feature correlation heatmap.

        Args:
            X: DataFrame or concatenated train/test features
            filename: Output filename
        """
        cls.header(figsize=(10, 8))
        correlation_matrix = X.corr()
        sns.heatmap(correlation_matrix, annot=True, cmap="coolwarm", center=0)
        plt.title("Feature Correlation Heatmap")
        cls.footer(filename)

    @classmethod
    def tree(cls, clf, feature_names, class_names, filename="decision_tree.png"):
        """Render single decision tree visualization.

        Args:
            clf: Trained DecisionTreeClassifier
            feature_names: List of feature names
            class_names: List of class names
            filename: Output filename
        """
        cls.header(figsize=(20, 12))
        plot_tree(
            clf,
            feature_names=feature_names,
            class_names=class_names,
            filled=True,
            rounded=True,
            fontsize=10
        )
        plt.title("Decision Tree Visualization")
        cls.footer(filename)

    @classmethod
    def tree_importance(cls, clf, feature_names, filename="tree_feature_importance.png"):
        """Render feature importance bar chart for decision tree.

        Args:
            clf: Trained DecisionTreeClassifier
            feature_names: List of feature names
            filename: Output filename
        """
        cls.header(figsize=(10, 6))
        feature_importance = pd.Series(clf.feature_importances_, index=feature_names)
        feature_importance.sort_values(ascending=True).plot(kind="barh", color="steelblue")
        plt.xlabel("Importance")
        plt.ylabel("Feature")
        plt.title("Decision Tree Feature Importance")
        cls.footer(filename)

    @classmethod
    def tree_boundaries(cls, clf, X, y, feature_names, filename_prefix="tree_boundaries"):
        """Render decision boundaries for all feature pairs.

        Args:
            clf: Trained DecisionTreeClassifier
            X: Feature data (DataFrame)
            y: Target labels
            feature_names: List of feature names
            filename_prefix: Prefix for output filenames
        """
        le = LabelEncoder()
        y_encoded = le.fit_transform(y)
        class_names = le.classes_

        feature_pairs = list(combinations(range(len(feature_names)), 2))
        n_pairs = len(feature_pairs)
        cols = min(3, n_pairs)
        rows = (n_pairs + cols - 1) // cols

        fig, axes = cls.header(figsize=(5 * cols, 4 * rows), subplots=(rows, cols))
        axes = np.array(axes).flatten()

        for idx, (i, j) in enumerate(feature_pairs):
            ax = axes[idx]

            # Train a new tree on just these two features
            X_pair = X.iloc[:, [i, j]].values
            clf_2d = clf.__class__(random_state=42)
            clf_2d.fit(X_pair, y)

            DecisionBoundaryDisplay.from_estimator(
                clf_2d, X_pair, ax=ax,
                response_method="predict",
                cmap="RdYlBu",
                alpha=0.5
            )

            scatter = ax.scatter(X_pair[:, 0], X_pair[:, 1], c=y_encoded,
                                  cmap="RdYlBu", edgecolors="k", s=20)
            ax.set_xlabel(feature_names[i])
            ax.set_ylabel(feature_names[j])
            ax.set_title(f"{feature_names[i]} vs {feature_names[j]}")

        # Hide unused axes
        for idx in range(n_pairs, len(axes)):
            axes[idx].set_visible(False)

        cls.footer(f"{filename_prefix}.png", title="Decision Boundaries")

    @classmethod
    def forest_importance(cls, clf, feature_names, filename="forest_feature_importance.png", color="forestgreen", title="Random Forest Feature Importance"):
        """Render feature importance bar chart.

        Args:
            clf: Trained forest classifier with feature_importances_
            feature_names: List/Index of feature names
            filename: Output filename
            color: Bar color
            title: Plot title
        """
        cls.header(figsize=(10, 6))
        feature_importance = pd.Series(clf.feature_importances_, index=feature_names)
        feature_importance.sort_values(ascending=True).plot(kind="barh", color=color)
        plt.xlabel("Importance")
        plt.ylabel("Feature")
        plt.title(title)
        cls.footer(filename)

    @classmethod
    def forest_trees(cls, clf, feature_names, class_names, grid_sizes=None, filename_prefix="forest_trees"):
        """Render sample trees from random forest in grid layouts.

        Args:
            clf: Trained RandomForestClassifier
            feature_names: List of feature names
            class_names: List of class names
            grid_sizes: List of (rows, cols) tuples for grid layouts
            filename_prefix: Prefix for output filenames
        """
        if grid_sizes is None:
            grid_sizes = [(2, 2), (3, 3), (4, 4)]

        for rows, cols in grid_sizes:
            fig, axes = cls.header(
                figsize=(cols * 5, rows * 4),
                subplots=(rows, cols)
            )
            for idx, ax in enumerate(axes.flatten()):
                plot_tree(
                    clf.estimators_[idx],
                    feature_names=feature_names,
                    class_names=class_names,
                    filled=True,
                    rounded=True,
                    ax=ax,
                    fontsize=max(2, 8 - rows)
                )
                ax.set_title(f"Tree {idx + 1}", fontsize=max(6, 12 - rows))
            cls.footer(
                f"{filename_prefix}_{rows}x{cols}.png",
                title=f"Random Forest Sample Trees ({rows}x{cols})"
            )

    @classmethod
    def forest_pdp(cls, clf, X, feature_names, filename="forest_pdp.png", target=0):
        """Render Partial Dependence Plots for random forest.

        Args:
            clf: Trained RandomForestClassifier
            X: Feature data
            feature_names: List of feature names
            filename: Output filename
            target: Target class index for multi-class (default 0)
        """
        n_features = len(feature_names)
        fig, axes = cls.header(
            figsize=(4 * n_features, 4),
            subplots=(1, n_features)
        )
        PartialDependenceDisplay.from_estimator(
            clf, X, features=range(n_features),
            feature_names=feature_names,
            ax=axes,
            kind="average",
            target=target
        )
        cls.footer(filename, title=f"Partial Dependence Plots (target={target})")

    @classmethod
    def forest_ice(cls, clf, X, feature_names, filename="forest_ice.png", target=0):
        """Render Individual Conditional Expectation plots for random forest.

        Args:
            clf: Trained RandomForestClassifier
            X: Feature data
            feature_names: List of feature names
            filename: Output filename
            target: Target class index for multi-class (default 0)
        """
        n_features = len(feature_names)
        fig, axes = cls.header(
            figsize=(4 * n_features, 4),
            subplots=(1, n_features)
        )
        PartialDependenceDisplay.from_estimator(
            clf, X, features=range(n_features),
            feature_names=feature_names,
            ax=axes,
            kind="both",
            target=target,
            ice_lines_kw={"color": "tab:blue", "alpha": 0.1, "linewidth": 0.5},
            pd_line_kw={"color": "tab:orange", "linewidth": 2}
        )
        cls.footer(filename, title=f"ICE Plots (target={target})")

    @classmethod
    def forest_oob(cls, clf, filename="forest_oob.png"):
        """Render OOB error visualization for random forest.

        Args:
            clf: Trained RandomForestClassifier with oob_score=True
            filename: Output filename
        """
        cls.header(figsize=(10, 6))

        if not hasattr(clf, 'oob_score_'):
            raise ValueError("Classifier must be trained with oob_score=True")

        oob_error = 1 - clf.oob_score_
        plt.bar(["OOB Error", "OOB Accuracy"], [oob_error, clf.oob_score_],
                color=["salmon", "forestgreen"])
        plt.ylabel("Score")
        plt.ylim(0, 1)
        for i, v in enumerate([oob_error, clf.oob_score_]):
            plt.text(i, v + 0.02, f"{v:.4f}", ha="center", fontweight="bold")
        plt.title(f"Out-of-Bag Error: {oob_error:.4f}")
        cls.footer(filename)

    @classmethod
    def forest_proximity(cls, clf, X, filename="forest_proximity.png"):
        """Render proximity matrix heatmap for random forest.

        Args:
            clf: Trained RandomForestClassifier
            X: Feature data
            filename: Output filename
        """
        # Compute proximity matrix
        leaves = clf.apply(X)
        n_samples = len(X)
        proximity = np.zeros((n_samples, n_samples))

        for tree_leaves in leaves.T:
            for i in range(n_samples):
                for j in range(i, n_samples):
                    if tree_leaves[i] == tree_leaves[j]:
                        proximity[i, j] += 1
                        proximity[j, i] += 1

        proximity /= clf.n_estimators
        np.fill_diagonal(proximity, 1)

        cls.header(figsize=(10, 8))
        sns.heatmap(proximity, cmap="YlGnBu", square=True,
                    xticklabels=False, yticklabels=False)
        plt.xlabel("Sample")
        plt.ylabel("Sample")
        cls.footer(filename, title="Random Forest Proximity Matrix")

    @classmethod
    def gradient_forest_importance(cls, importances, feature_names, filename="gradient_forest_feature_importance.png"):
        """Render feature importance bar chart for gradient boosted trees.

        Args:
            importances: Array of importance values (one per feature)
            feature_names: List of feature names
            filename: Output filename
        """
        cls.header(figsize=(10, 6))
        feature_importance = pd.Series(importances, index=feature_names)
        feature_importance.sort_values(ascending=True).plot(kind="barh", color="darkorange")
        plt.xlabel("Importance")
        plt.ylabel("Feature")
        plt.title("Gradient Boosted Trees Feature Importance")
        cls.footer(filename)

    @classmethod
    def gradient_forest_staged(cls, clf, X_train, X_test, y_train, y_test, filename="gradient_forest_staged_accuracy.png"):
        """Render staged training accuracy for gradient boosting.

        Args:
            clf: Trained GradientBoostingClassifier
            X_train, X_test: Feature data
            y_train, y_test: Target data
            filename: Output filename
        """
        cls.header(figsize=(10, 6))

        train_scores = []
        test_scores = []
        for y_pred_staged in clf.staged_predict(X_train):
            train_scores.append(accuracy_score(y_train, y_pred_staged))
        for y_pred_staged in clf.staged_predict(X_test):
            test_scores.append(accuracy_score(y_test, y_pred_staged))

        plt.plot(range(1, len(train_scores) + 1), train_scores, label="Train", color="blue")
        plt.plot(range(1, len(test_scores) + 1), test_scores, label="Test", color="red")
        plt.xlabel("Boosting Iterations")
        plt.ylabel("Accuracy")
        plt.title("Gradient Boosting Staged Accuracy")
        plt.legend()
        cls.footer(filename)

    @classmethod
    def gradient_forest_trees(cls, clf, feature_names, filename="gradient_forest_trees.png"):
        """Render sample trees from gradient boosting by class and iteration.

        Args:
            clf: Trained GradientBoostingClassifier
            feature_names: List of feature names
            filename: Output filename
        """
        n_classes = len(clf.classes_)
        fig, axes = cls.header(
            figsize=(20, n_classes * 4),
            subplots=(n_classes, 4)
        )

        for class_idx in range(n_classes):
            for iter_idx in range(4):
                ax = axes[class_idx, iter_idx]
                plot_tree(
                    clf.estimators_[iter_idx, class_idx],
                    feature_names=feature_names,
                    filled=True,
                    rounded=True,
                    ax=ax,
                    fontsize=7
                )
                ax.set_title(f"Class {class_idx} - Iter {iter_idx + 1}")

        cls.footer(filename, title="Gradient Boosting Sample Trees (by class and iteration)")

    @classmethod
    def compare_accuracy(cls, mask_values, results, colors, filename="accuracy_comparison.png"):
        """Render accuracy comparison across models.

        Args:
            mask_values: List of mask percentages (x-axis)
            results: Dict mapping model names to accuracy lists
            colors: Dict mapping model names to colors
            filename: Output filename
        """
        cls.header(figsize=(12, 8))
        ax = plt.gca()

        for name, color in colors.items():
            if name in results:
                ax.plot(mask_values, results[name],
                        label=name, color=color, linewidth=2, marker="o")

        ax.set_xlabel("Mask %", fontsize=12)
        ax.set_ylabel("Accuracy", fontsize=12)
        ax.set_title("Model Accuracy vs Missing Data Rate", fontsize=14)
        ax.set_xlim(0, max(mask_values))
        ax.set_ylim(0, 1.05)
        ax.set_xticks(mask_values)
        ax.legend(loc="lower left", fontsize=10)
        ax.grid(True, alpha=0.3)
        cls.footer(filename)

    @classmethod
    def compare_accuracy_impute(cls, mask_values, results, colors, filename="accuracy_comparison_impute.png"):
        """Render accuracy comparison with imputation variants.

        Args:
            mask_values: List of mask percentages (x-axis)
            results: Dict mapping model names to accuracy lists (includes {name}_impute keys)
            colors: Dict mapping model names to colors
            filename: Output filename
        """
        cls.header(figsize=(12, 8))
        ax = plt.gca()

        for name, color in colors.items():
            if name in results:
                ax.plot(mask_values, results[name],
                        label=name, color=color, linewidth=2, marker="o")
            if f"{name}_impute" in results:
                ax.plot(mask_values, results[f"{name}_impute"],
                        label=f"{name} (imputed)", color=color, linewidth=2,
                        linestyle="--", marker="s", alpha=0.7)

        ax.set_xlabel("Mask %", fontsize=12)
        ax.set_ylabel("Accuracy", fontsize=12)
        ax.set_title("Model Accuracy vs Missing Data Rate (with Imputation)", fontsize=14)
        ax.set_xlim(0, max(mask_values))
        ax.set_ylim(0, 1.05)
        ax.set_xticks(mask_values)
        ax.legend(loc="lower left", fontsize=10)
        ax.grid(True, alpha=0.3)
        cls.footer(filename)
