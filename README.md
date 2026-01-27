# D-trees and Random Forests

A Python application for training decision tree and random forest models using TensorFlow, Keras, and the Iris dataset.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

### 1. Build the devcontainer

```bash
make devcontainer.build
```

### 2. Start the devcontainer

```bash
make devcontainer.start
```

### 3. Enter the container

```bash
make devcontainer.shell
```

### 4. Run commands inside the container

```bash
# Train a decision tree model
make tree

# Train a random forest model
make forest

# Train a gradient boosted trees model
make gradient

# Train with 30% masked data
make tree MASK=30

# Train with images output
make forest MASK=30 IMAGES=true

# Train using cached masked dataset with imputation
make forest MASK=30 USE_OUTPUT=true IMPUTE=true

# Use Claude CLI
claude
```

## Make Commands

### Model Training

| Command | Description |
|---------|-------------|
| `make tree` | Train a decision tree model |
| `make forest` | Train a random forest model |
| `make gradient` | Train a gradient boosted trees model |
| `make compare` | Run accuracy comparison across all models and mask rates |

### Parameters

All training commands support these parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `MASK` | Mask percentage for missing values (0-100). Default: 0 | `MASK=30` |
| `USE_OUTPUT` | Load from cached CSV files instead of downloading | `USE_OUTPUT=true` |
| `IMPUTE` | Impute missing values in training set only | `IMPUTE=true` |
| `IMAGES` | Generate plot images to `./output/` | `IMAGES=true` |
| `ACCURACY_ONLY` | Output only accuracy as float | `ACCURACY_ONLY=true` |
| `DATASET` | Dataset to use: Iris or Income | `DATASET=Income` |

### Examples

```bash
# Basic training
make tree
make forest
make gradient

# Train with 30% masked data and generate images
make tree MASK=30 IMAGES=true

# Train with masking, imputation, and images
make forest MASK=30 IMPUTE=true IMAGES=true

# Reuse cached dataset
make tree MASK=30 USE_OUTPUT=true
```

### Output Files

Output files are saved to `./output/` and include the mask percentage in their names:
- `forest_trees_0_2x2.png` - No masking (0%)
- `forest_trees_30_2x2.png` - 30% mask rate
- `iris_masked_30_train.csv` - Cached training data with 30% mask
- `gradient_forest_feature_importance_30.png` - Gradient boosted trees importance with 30% mask

### Devcontainer Management

| Command | Description |
|---------|-------------|
| `make devcontainer.start` | Start the devcontainer |
| `make devcontainer.stop` | Stop the devcontainer |
| `make devcontainer.restart` | Restart the devcontainer |
| `make devcontainer.build` | Build the devcontainer image |
| `make devcontainer.rebuild` | Rebuild the devcontainer image (no cache) |
| `make devcontainer.shell` | Start a shell session in the devcontainer |
