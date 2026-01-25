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

# Train with 30% masked data
make tree MASK=0.3

# Train using cached masked dataset
make forest MASK=0.3 USE_OUTPUT=true

# Use Claude CLI
claude
```

## Make Commands

### Model Training

| Command | Description |
|---------|-------------|
| `make tree` | Train a decision tree model |
| `make tree MASK=0.3` | Train decision tree with 30% masked data |
| `make tree MASK=0.3 USE_OUTPUT=true` | Train using cached masked dataset |
| `make forest` | Train a random forest model |
| `make forest MASK=0.3` | Train random forest with 30% masked data |
| `make forest MASK=0.3 USE_OUTPUT=true` | Train using cached masked dataset |

### Parameters

- `MASK` - Mask rate for missing values (0.0-1.0). Default: 0
- `USE_OUTPUT` - Set to `true` to load from cached CSV files instead of downloading

### Output Files

Output files include the mask percentage in their names:
- `forest_trees_0_2x2.png` - No masking (0%)
- `forest_trees_30_2x2.png` - 30% mask rate
- `iris_masked_30_train.csv` - Cached training data with 30% mask

### Devcontainer Management

| Command | Description |
|---------|-------------|
| `make devcontainer.start` | Start the devcontainer |
| `make devcontainer.stop` | Stop the devcontainer |
| `make devcontainer.restart` | Restart the devcontainer |
| `make devcontainer.build` | Build the devcontainer image |
| `make devcontainer.rebuild` | Rebuild the devcontainer image (no cache) |
| `make devcontainer.shell` | Start a shell session in the devcontainer |
