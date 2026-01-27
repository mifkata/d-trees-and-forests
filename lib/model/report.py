from sklearn.metrics import accuracy_score, classification_report


def report(y_true, y_pred, accuracy_only=False):
    """Print accuracy and classification report.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        accuracy_only: If True, output only accuracy as quoted float
    """
    accuracy = accuracy_score(y_true, y_pred)

    if accuracy_only:
        print(f"{accuracy:.4f}", end="")
        return

    print(f"Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred))
