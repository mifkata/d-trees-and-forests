from sklearn.metrics import accuracy_score, classification_report


def report(y_true, y_pred):
    """Print accuracy and classification report.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
    """
    accuracy = accuracy_score(y_true, y_pred)
    print(f"Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred))
