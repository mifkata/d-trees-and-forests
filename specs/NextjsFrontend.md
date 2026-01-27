# Next.js Frontend Specification

## Overview

A Next.js web application that provides a single-page UI for training and evaluating machine learning models. Users can select datasets, models, and configure parameters through an intuitive interface. The application executes Python training scripts via API routes and displays results in real-time.

## Technology Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS 3.4+
- **Component Variants:** tailwind-variants
- **Language:** TypeScript
- **State Management:** React hooks + Local Storage
- **HTTP Client:** Native fetch API

## Architecture

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Main training UI page
│   │   ├── globals.css             # Tailwind imports + custom styles
│   │   └── api/
│   │       └── train/
│   │           └── route.ts        # POST endpoint for training
│   ├── components/
│   │   ├── ui/                     # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   ├── DatasetSelector.tsx     # Dataset dropdown (Iris, Income)
│   │   ├── ModelSelector.tsx       # Model dropdown (tree, forest, gradient)
│   │   ├── DatasetParams.tsx       # Dataset parameter controls
│   │   ├── ModelParams.tsx         # Model hyperparameter controls
│   │   ├── TrainButton.tsx         # Submit button with loading state
│   │   ├── ResultsDisplay.tsx      # Training results output
│   │   └── ErrorDisplay.tsx        # Error message display
│   ├── hooks/
│   │   ├── useLocalStorage.ts      # Generic local storage hook
│   │   ├── useParamsCache.ts       # Dataset/model params caching
│   │   └── useTraining.ts          # Training API mutation hook
│   ├── lib/
│   │   ├── api.ts                  # API client functions
│   │   ├── storage.ts              # Local storage utilities
│   │   ├── validation.ts           # Parameter validation
│   │   └── constants.ts            # Datasets, models, defaults
│   └── types/
│       ├── dataset.ts              # Dataset types
│       ├── model.ts                # Model types
│       ├── params.ts               # Parameter types
│       └── api.ts                  # API request/response types
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Data Models

### Datasets

```typescript
// types/dataset.ts

type DatasetId = 'Iris' | 'Income';

interface Dataset {
  id: DatasetId;
  name: string;
  description: string;
  features: string[];
  targetClasses: string[];
}

const DATASETS: Record<DatasetId, Dataset> = {
  Iris: {
    id: 'Iris',
    name: 'Iris',
    description: 'Classic iris flower classification dataset',
    features: ['SepalLengthCm', 'SepalWidthCm', 'PetalLengthCm', 'PetalWidthCm'],
    targetClasses: ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'],
  },
  Income: {
    id: 'Income',
    name: 'Income (Adult Census)',
    description: 'Predict income level from census data',
    features: ['age', 'workclass', 'fnlwgt', 'education', 'education_num',
               'marital_status', 'occupation', 'relationship', 'race', 'sex',
               'capital_gain', 'capital_loss', 'hours_per_week', 'native_country'],
    targetClasses: ['<=50K', '>50K'],
  },
};
```

### Models

```typescript
// types/model.ts

type ModelId = 'tree' | 'forest' | 'gradient';

interface Model {
  id: ModelId;
  name: string;
  description: string;
  script: string;
}

const MODELS: Record<ModelId, Model> = {
  tree: {
    id: 'tree',
    name: 'Decision Tree',
    description: 'Single decision tree classifier',
    script: 'train-tree.py',
  },
  forest: {
    id: 'forest',
    name: 'Random Forest',
    description: 'Ensemble of decision trees with bagging',
    script: 'train-forest.py',
  },
  gradient: {
    id: 'gradient',
    name: 'Gradient Boosted Trees',
    description: 'Ensemble with gradient boosting (HistGradientBoostingClassifier)',
    script: 'train-gradient-forest.py',
  },
};
```

### Parameters

```typescript
// types/params.ts

// Dataset parameters (shared across all models)
interface DatasetParams {
  mask: number;           // 0-100, percentage of missing values
  impute: boolean;        // Whether to impute missing values in training set
  useOutput: boolean;     // Load from cached CSV files
  images: boolean;        // Generate visualization images
}

const DEFAULT_DATASET_PARAMS: DatasetParams = {
  mask: 0,
  impute: false,
  useOutput: false,
  images: false,
};

// Model-specific hyperparameters
// These match the YAML config files in /config/

interface TreeParams {
  criterion: 'gini' | 'entropy' | 'log_loss';
  splitter: 'best' | 'random';
  maxDepth: number | null;          // null = unlimited
  minSamplesSplit: number;          // minimum 2
  minSamplesLeaf: number;           // minimum 1
  maxFeatures: 'sqrt' | 'log2' | number | null;
}

interface ForestParams {
  nEstimators: number;              // number of trees
  criterion: 'gini' | 'entropy' | 'log_loss';
  maxDepth: number | null;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  maxFeatures: 'sqrt' | 'log2' | number | null;
  bootstrap: boolean;
  oobScore: boolean;                // out-of-bag scoring
  maxSamples: number | null;        // samples per tree
}

interface GradientParams {
  loss: 'log_loss';
  learningRate: number;             // 0.01 - 1.0
  maxIter: number;                  // max boosting iterations
  maxLeafNodes: number | null;
  maxDepth: number | null;
  minSamplesLeaf: number;
  maxBins: number;                  // max bins for histogram
  earlyStopping: boolean | 'auto';
}

type ModelParams = TreeParams | ForestParams | GradientParams;

// Default hyperparameters per model+dataset (mirrors YAML configs)
const DEFAULT_MODEL_PARAMS: Record<ModelId, Record<DatasetId, ModelParams>> = {
  tree: {
    Iris: {
      criterion: 'gini',
      splitter: 'best',
      maxDepth: null,
      minSamplesSplit: 2,
      minSamplesLeaf: 1,
      maxFeatures: null,
    },
    Income: {
      criterion: 'gini',
      splitter: 'best',
      maxDepth: 10,
      minSamplesSplit: 20,
      minSamplesLeaf: 10,
      maxFeatures: null,
    },
  },
  forest: {
    Iris: {
      nEstimators: 10,
      criterion: 'gini',
      maxDepth: 3,
      minSamplesSplit: 2,
      minSamplesLeaf: 1,
      maxFeatures: 'sqrt',
      bootstrap: true,
      oobScore: true,
      maxSamples: 100,
    },
    Income: {
      nEstimators: 100,
      criterion: 'gini',
      maxDepth: 10,
      minSamplesSplit: 20,
      minSamplesLeaf: 10,
      maxFeatures: 'sqrt',
      bootstrap: true,
      oobScore: false,
      maxSamples: null,
    },
  },
  gradient: {
    Iris: {
      loss: 'log_loss',
      learningRate: 0.2,
      maxIter: 200,
      maxLeafNodes: 31,
      maxDepth: 4,
      minSamplesLeaf: 1,
      maxBins: 255,
      earlyStopping: false,
    },
    Income: {
      loss: 'log_loss',
      learningRate: 0.1,
      maxIter: 200,
      maxLeafNodes: 31,
      maxDepth: 6,
      minSamplesLeaf: 20,
      maxBins: 255,
      earlyStopping: 'auto',
    },
  },
};
```

---

## Local Storage Caching

### Cache Key Structure

Parameters are cached per dataset+model combination using a composite key:

```typescript
// lib/storage.ts

const STORAGE_PREFIX = 'd-trees';

// Cache keys
const getDatasetParamsKey = (dataset: DatasetId, model: ModelId): string =>
  `${STORAGE_PREFIX}:dataset-params:${dataset}:${model}`;

const getModelParamsKey = (dataset: DatasetId, model: ModelId): string =>
  `${STORAGE_PREFIX}:model-params:${dataset}:${model}`;

const getLastSelectionKey = (): string =>
  `${STORAGE_PREFIX}:last-selection`;

// Example stored keys:
// d-trees:dataset-params:Iris:tree
// d-trees:dataset-params:Iris:forest
// d-trees:dataset-params:Income:gradient
// d-trees:model-params:Iris:tree
// d-trees:model-params:Income:forest
// d-trees:last-selection
```

### Storage Interface

```typescript
// lib/storage.ts

interface LastSelection {
  dataset: DatasetId;
  model: ModelId;
}

interface ParamsStorage {
  // Get cached params or return defaults
  getDatasetParams(dataset: DatasetId, model: ModelId): DatasetParams;
  getModelParams(dataset: DatasetId, model: ModelId): ModelParams;
  getLastSelection(): LastSelection | null;

  // Save params to cache
  setDatasetParams(dataset: DatasetId, model: ModelId, params: DatasetParams): void;
  setModelParams(dataset: DatasetId, model: ModelId, params: ModelParams): void;
  setLastSelection(selection: LastSelection): void;

  // Clear cache
  clearAll(): void;
  clearForCombo(dataset: DatasetId, model: ModelId): void;
}
```

### Hook Implementation

```typescript
// hooks/useParamsCache.ts

interface UseParamsCacheReturn {
  // Current selections
  dataset: DatasetId;
  model: ModelId;
  datasetParams: DatasetParams;
  modelParams: ModelParams;

  // Setters (auto-save to localStorage)
  setDataset: (dataset: DatasetId) => void;
  setModel: (model: ModelId) => void;
  setDatasetParams: (params: Partial<DatasetParams>) => void;
  setModelParams: (params: Partial<ModelParams>) => void;

  // Reset to defaults
  resetDatasetParams: () => void;
  resetModelParams: () => void;
}

function useParamsCache(): UseParamsCacheReturn {
  // 1. On mount, restore last selection from localStorage
  // 2. When dataset/model changes:
  //    a. Save new selection to localStorage
  //    b. Load cached params for new combination
  //    c. If no cache exists, use defaults
  // 3. When params change, save to localStorage
  // 4. When selection changes, params update to cached/default values
}
```

### Restoration Behavior

On page load/refresh:

1. Read `d-trees:last-selection` from localStorage
2. If exists, restore dataset and model to those values
3. Read cached params for the restored combination
4. If no cached params, use default values from `DEFAULT_*_PARAMS`
5. If no last selection, default to `Iris` + `tree`

---

## API Design

### Request Format

```typescript
// types/api.ts

interface TrainRequest {
  dataset: DatasetId;
  model: ModelId;
  datasetParams: DatasetParams;
  modelParams: ModelParams;
}
```

### Response Format

```typescript
// types/api.ts

// Success response
interface TrainSuccessResponse {
  success: true;
  data: TrainResult;
}

interface TrainResult {
  accuracy: number;                    // 0.0 - 1.0
  accuracyPercent: string;             // "98.00%"
  classificationReport: ClassificationReport;
  modelInfo?: ModelInfo;               // Additional model-specific info
  images?: GeneratedImage[];           // If images=true
  executionTime: number;               // milliseconds
}

interface ClassificationReport {
  classes: ClassMetrics[];
  accuracy: number;
  macroAvg: AggregateMetrics;
  weightedAvg: AggregateMetrics;
}

interface ClassMetrics {
  label: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

interface AggregateMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

interface ModelInfo {
  type: ModelId;
  nIterations?: number;         // For gradient boosting
  nEstimators?: number;         // For random forest
  oobScore?: number;            // For random forest with oob_score=true
  treeDepth?: number;           // For decision tree
}

interface GeneratedImage {
  filename: string;
  path: string;                 // Relative path in /output
  description: string;
}

// Error response
interface TrainErrorResponse {
  success: false;
  error: TrainError;
}

interface TrainError {
  message: string;              // User-friendly error message
  code: ErrorCode;              // Machine-readable error code
  details?: string;             // Additional details (stderr output)
  stackTrace?: string;          // Python stack trace (if available)
}

type ErrorCode =
  | 'SCRIPT_NOT_FOUND'
  | 'SCRIPT_EXECUTION_ERROR'
  | 'INVALID_JSON_OUTPUT'
  | 'INVALID_PARAMS'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

type TrainResponse = TrainSuccessResponse | TrainErrorResponse;
```

### API Route Implementation

```typescript
// app/api/train/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

const SCRIPTS_DIR = path.resolve(process.cwd(), '..');  // Parent directory
const SCRIPT_TIMEOUT = 300000;  // 5 minutes

export async function POST(request: NextRequest): Promise<NextResponse<TrainResponse>> {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request body
    const body: TrainRequest = await request.json();
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json({
        success: false,
        error: {
          message: validationError,
          code: 'INVALID_PARAMS',
        },
      }, { status: 400 });
    }

    // 2. Build command arguments
    const { dataset, model, datasetParams, modelParams } = body;
    const script = MODELS[model].script;
    const args = buildArgs(dataset, datasetParams, modelParams);

    // 3. Execute Python script
    const result = await executeScript(script, args);

    // 4. Parse JSON output
    const jsonOutput = parseJsonOutput(result.stdout);
    if (!jsonOutput) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Script did not return valid JSON',
          code: 'INVALID_JSON_OUTPUT',
          details: result.stdout,
          stackTrace: result.stderr || undefined,
        },
      }, { status: 500 });
    }

    // 5. Return success response
    return NextResponse.json({
      success: true,
      data: {
        ...jsonOutput,
        executionTime: Date.now() - startTime,
      },
    });

  } catch (error) {
    // Handle execution errors
    if (error instanceof ScriptError) {
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          stackTrace: error.stackTrace,
        },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        details: String(error),
      },
    }, { status: 500 });
  }
}

function buildArgs(
  dataset: DatasetId,
  datasetParams: DatasetParams,
  modelParams: ModelParams
): string[] {
  const args: string[] = [
    '--json',                           // Required: output JSON format
    '--dataset', dataset,
    '--mask', String(datasetParams.mask),
  ];

  if (datasetParams.impute) {
    args.push('--impute');
  }

  if (datasetParams.useOutput) {
    args.push('--use-output', 'true');
  }

  if (datasetParams.images) {
    args.push('--images');
  }

  // Add model-specific params
  // Convert camelCase to kebab-case for CLI args
  for (const [key, value] of Object.entries(modelParams)) {
    if (value !== null && value !== undefined) {
      const argName = `--${camelToKebab(key)}`;
      if (typeof value === 'boolean') {
        if (value) args.push(argName);
      } else {
        args.push(argName, String(value));
      }
    }
  }

  return args;
}

async function executeScript(script: string, args: string[]): Promise<ScriptResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, script);
    const child = spawn('python', [scriptPath, ...args], {
      cwd: SCRIPTS_DIR,
      timeout: SCRIPT_TIMEOUT,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new ScriptError(
          `Script exited with code ${code}`,
          'SCRIPT_EXECUTION_ERROR',
          stderr || stdout,
          extractStackTrace(stderr)
        ));
      }
    });

    child.on('error', (err) => {
      reject(new ScriptError(
        `Failed to execute script: ${err.message}`,
        'SCRIPT_NOT_FOUND',
        err.message
      ));
    });
  });
}
```

---

## Python Script Modifications

### New `--json` Flag

Add a `--json` flag to all training scripts that outputs structured JSON instead of plain text.

```python
# lib/args/__init__.py (additions)

parser.add_argument(
    '--json',
    action='store_true',
    default=False,
    help='Output results as JSON (for API consumption)'
)
```

### JSON Output Format

When `--json` flag is present, scripts output:

```python
# lib/model/report.py (additions)

import json

def report_json(y_test, y_pred, model, model_type, images_generated=None):
    """Generate JSON report for API consumption."""
    from sklearn.metrics import (
        accuracy_score,
        classification_report,
    )

    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    # Build class metrics
    classes = []
    for label, metrics in report.items():
        if label in ['accuracy', 'macro avg', 'weighted avg']:
            continue
        classes.append({
            'label': label,
            'precision': metrics['precision'],
            'recall': metrics['recall'],
            'f1Score': metrics['f1-score'],
            'support': int(metrics['support']),
        })

    result = {
        'accuracy': accuracy,
        'accuracyPercent': f'{accuracy * 100:.2f}%',
        'classificationReport': {
            'classes': classes,
            'accuracy': report['accuracy'],
            'macroAvg': {
                'precision': report['macro avg']['precision'],
                'recall': report['macro avg']['recall'],
                'f1Score': report['macro avg']['f1-score'],
                'support': int(report['macro avg']['support']),
            },
            'weightedAvg': {
                'precision': report['weighted avg']['precision'],
                'recall': report['weighted avg']['recall'],
                'f1Score': report['weighted avg']['f1-score'],
                'support': int(report['weighted avg']['support']),
            },
        },
        'modelInfo': get_model_info(model, model_type),
    }

    if images_generated:
        result['images'] = images_generated

    print(json.dumps(result))


def get_model_info(model, model_type):
    """Extract model-specific information."""
    info = {'type': model_type}

    if model_type == 'tree':
        info['treeDepth'] = model.get_depth()
        info['nLeaves'] = model.get_n_leaves()
    elif model_type == 'forest':
        info['nEstimators'] = model.n_estimators
        if hasattr(model, 'oob_score_'):
            info['oobScore'] = model.oob_score_
    elif model_type == 'gradient':
        info['nIterations'] = model.n_iter_

    return info
```

### Model Params from CLI

Add CLI arguments for model hyperparameters:

```python
# lib/args/__init__.py (additions for model params)

# Decision Tree params
parser.add_argument('--criterion', choices=['gini', 'entropy', 'log_loss'], default=None)
parser.add_argument('--splitter', choices=['best', 'random'], default=None)
parser.add_argument('--max-depth', type=int, default=None)
parser.add_argument('--min-samples-split', type=int, default=None)
parser.add_argument('--min-samples-leaf', type=int, default=None)
parser.add_argument('--max-features', default=None)

# Random Forest additional params
parser.add_argument('--n-estimators', type=int, default=None)
parser.add_argument('--bootstrap', type=lambda x: x.lower() == 'true', default=None)
parser.add_argument('--oob-score', type=lambda x: x.lower() == 'true', default=None)
parser.add_argument('--max-samples', type=int, default=None)

# Gradient Boosting additional params
parser.add_argument('--learning-rate', type=float, default=None)
parser.add_argument('--max-iter', type=int, default=None)
parser.add_argument('--max-leaf-nodes', type=int, default=None)
parser.add_argument('--max-bins', type=int, default=None)
parser.add_argument('--early-stopping', default=None)
```

Training scripts should merge CLI params with YAML config (CLI takes precedence):

```python
# Example in train-tree.py

def get_model_params(args, config):
    """Merge YAML config with CLI overrides."""
    params = config.copy()

    cli_overrides = {
        'criterion': args.criterion,
        'splitter': args.splitter,
        'max_depth': args.max_depth,
        'min_samples_split': args.min_samples_split,
        'min_samples_leaf': args.min_samples_leaf,
        'max_features': args.max_features,
    }

    for key, value in cli_overrides.items():
        if value is not None:
            params[key] = value

    return params
```

---

## UI Components

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  D-Trees & Random Forests                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐          │
│  │  Dataset                 │  │  Model                  │          │
│  │  ┌───────────────────┐  │  │  ┌───────────────────┐  │          │
│  │  │ Iris          ▼   │  │  │  │ Decision Tree ▼   │  │          │
│  │  └───────────────────┘  │  │  └───────────────────┘  │          │
│  └─────────────────────────┘  └─────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Dataset Parameters                                           │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Mask Rate                                      [30]%  │  │  │
│  │  │  ──────────────────●──────────────────────────────     │  │  │
│  │  │  0%                                              100%  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  ☐ Impute missing values    ☐ Generate images                │  │
│  │  ☐ Use cached dataset                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Model Parameters (Decision Tree)                             │  │
│  │                                                               │  │
│  │  Criterion:  [Gini     ▼]    Splitter:  [Best     ▼]         │  │
│  │                                                               │  │
│  │  Max Depth:        [10    ]    Min Samples Split: [2     ]   │  │
│  │  Min Samples Leaf: [1     ]    Max Features:      [auto  ▼]  │  │
│  │                                                               │  │
│  │                           [Reset to Defaults]                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      [ Train Model ]                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Results                                              98.00%  │  │
│  │  ──────────────────────────────────────────────────────────  │  │
│  │                                                               │  │
│  │  Classification Report                                        │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Class          Precision  Recall   F1-Score  Support  │  │  │
│  │  │ Iris-setosa    1.00       1.00     1.00      17       │  │  │
│  │  │ Iris-versi...  0.94       1.00     0.97      16       │  │  │
│  │  │ Iris-virgin... 1.00       0.94     0.97      17       │  │  │
│  │  │ ────────────────────────────────────────────────────  │  │  │
│  │  │ Accuracy                           0.98      50       │  │  │
│  │  │ Macro avg      0.98       0.98     0.98      50       │  │  │
│  │  │ Weighted avg   0.98       0.98     0.98      50       │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  Model Info                                                   │  │
│  │  • Type: Decision Tree                                        │  │
│  │  • Tree Depth: 4                                              │  │
│  │  • Number of Leaves: 9                                        │  │
│  │                                                               │  │
│  │  Execution Time: 1.23s                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Variants (tailwind-variants)

```typescript
// components/ui/Button.tsx

import { tv, type VariantProps } from 'tailwind-variants';

const button = tv({
  base: [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  variants: {
    variant: {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700',
        'focus:ring-blue-500',
      ],
      secondary: [
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200',
        'focus:ring-gray-500',
      ],
      ghost: [
        'bg-transparent text-gray-600',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
      ],
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={button({ variant, size, fullWidth })}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}
```

```typescript
// components/ui/Card.tsx

import { tv, type VariantProps } from 'tailwind-variants';

const card = tv({
  base: 'rounded-lg border bg-white',
  variants: {
    variant: {
      default: 'border-gray-200',
      elevated: 'border-gray-200 shadow-md',
      outlined: 'border-gray-300',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
});

const cardHeader = tv({
  base: 'flex items-center justify-between border-b border-gray-200 pb-4 mb-4',
});

const cardTitle = tv({
  base: 'text-lg font-semibold text-gray-900',
});
```

### Error Display

```typescript
// components/ErrorDisplay.tsx

import { tv } from 'tailwind-variants';

const errorContainer = tv({
  base: [
    'rounded-lg border border-red-200 bg-red-50 p-4',
  ],
});

const errorTitle = tv({
  base: 'flex items-center gap-2 font-medium text-red-800 mb-2',
});

const errorMessage = tv({
  base: 'text-red-700 text-sm',
});

const errorDetails = tv({
  base: [
    'mt-3 p-3 rounded bg-red-100 text-red-800',
    'font-mono text-xs overflow-x-auto',
    'max-h-48 overflow-y-auto',
  ],
});

interface ErrorDisplayProps {
  error: TrainError;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={errorContainer()}>
      <div className={errorTitle()}>
        <AlertCircleIcon className="w-5 h-5" />
        <span>Training Failed</span>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-auto">
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className={errorMessage()}>{error.message}</p>

      {(error.details || error.stackTrace) && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-xs text-red-600 hover:underline"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>

          {showDetails && (
            <pre className={errorDetails()}>
              {error.stackTrace || error.details}
            </pre>
          )}
        </>
      )}

      <p className="mt-2 text-xs text-red-600">
        Error code: {error.code}
      </p>
    </div>
  );
}
```

### Model Parameters Form

Dynamic form that changes based on selected model:

```typescript
// components/ModelParams.tsx

interface ModelParamsProps {
  model: ModelId;
  dataset: DatasetId;
  params: ModelParams;
  onChange: (params: Partial<ModelParams>) => void;
  onReset: () => void;
}

export function ModelParams({ model, dataset, params, onChange, onReset }: ModelParamsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Parameters ({MODELS[model].name})</CardTitle>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset to Defaults
        </Button>
      </CardHeader>

      {model === 'tree' && (
        <TreeParamsForm params={params as TreeParams} onChange={onChange} />
      )}
      {model === 'forest' && (
        <ForestParamsForm params={params as ForestParams} onChange={onChange} />
      )}
      {model === 'gradient' && (
        <GradientParamsForm params={params as GradientParams} onChange={onChange} />
      )}
    </Card>
  );
}

function TreeParamsForm({ params, onChange }: { params: TreeParams; onChange: (p: Partial<TreeParams>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Select
        label="Criterion"
        value={params.criterion}
        onChange={(v) => onChange({ criterion: v as TreeParams['criterion'] })}
        options={[
          { value: 'gini', label: 'Gini' },
          { value: 'entropy', label: 'Entropy' },
          { value: 'log_loss', label: 'Log Loss' },
        ]}
      />

      <Select
        label="Splitter"
        value={params.splitter}
        onChange={(v) => onChange({ splitter: v as TreeParams['splitter'] })}
        options={[
          { value: 'best', label: 'Best' },
          { value: 'random', label: 'Random' },
        ]}
      />

      <Input
        label="Max Depth"
        type="number"
        value={params.maxDepth ?? ''}
        onChange={(v) => onChange({ maxDepth: v === '' ? null : Number(v) })}
        placeholder="Unlimited"
        min={1}
      />

      <Input
        label="Min Samples Split"
        type="number"
        value={params.minSamplesSplit}
        onChange={(v) => onChange({ minSamplesSplit: Number(v) })}
        min={2}
      />

      <Input
        label="Min Samples Leaf"
        type="number"
        value={params.minSamplesLeaf}
        onChange={(v) => onChange({ minSamplesLeaf: Number(v) })}
        min={1}
      />

      <Select
        label="Max Features"
        value={params.maxFeatures ?? 'auto'}
        onChange={(v) => onChange({ maxFeatures: v === 'auto' ? null : v })}
        options={[
          { value: 'auto', label: 'Auto (all)' },
          { value: 'sqrt', label: 'Square Root' },
          { value: 'log2', label: 'Log2' },
        ]}
      />
    </div>
  );
}
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Page Load                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Read localStorage: d-trees:last-selection                          │
│  → { dataset: 'Iris', model: 'forest' }                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Read localStorage: d-trees:dataset-params:Iris:forest              │
│  → { mask: 30, impute: true, useOutput: false, images: false }     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Read localStorage: d-trees:model-params:Iris:forest                │
│  → { nEstimators: 50, maxDepth: 5, ... }                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Render UI with restored state                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   User Changes Dataset/Model                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Save current params to localStorage for OLD combo               │
│  2. Update d-trees:last-selection                                   │
│  3. Load cached params for NEW combo (or defaults)                  │
│  4. Update UI with new params                                       │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   User Changes Parameter                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Update local state                                              │
│  2. Debounce (300ms)                                                │
│  3. Save to localStorage for current combo                          │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   User Clicks Train                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Set loading state                                               │
│  2. POST /api/train with current params                             │
│  3. On success: display results                                     │
│  4. On error: display error with details                            │
│  5. Clear loading state                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### Dataset Parameters

| Parameter | Type | Range | Default |
|-----------|------|-------|---------|
| mask | number | 0-100 | 0 |
| impute | boolean | true/false | false |
| useOutput | boolean | true/false | false |
| images | boolean | true/false | false |

### Tree Parameters

| Parameter | Type | Range | Default (Iris) | Default (Income) |
|-----------|------|-------|----------------|------------------|
| criterion | enum | gini, entropy, log_loss | gini | gini |
| splitter | enum | best, random | best | best |
| maxDepth | number \| null | ≥1 or null | null | 10 |
| minSamplesSplit | number | ≥2 | 2 | 20 |
| minSamplesLeaf | number | ≥1 | 1 | 10 |
| maxFeatures | enum \| null | sqrt, log2, null | null | null |

### Forest Parameters

| Parameter | Type | Range | Default (Iris) | Default (Income) |
|-----------|------|-------|----------------|------------------|
| nEstimators | number | ≥1 | 10 | 100 |
| criterion | enum | gini, entropy, log_loss | gini | gini |
| maxDepth | number \| null | ≥1 or null | 3 | 10 |
| minSamplesSplit | number | ≥2 | 2 | 20 |
| minSamplesLeaf | number | ≥1 | 1 | 10 |
| maxFeatures | enum \| null | sqrt, log2, null | sqrt | sqrt |
| bootstrap | boolean | true/false | true | true |
| oobScore | boolean | true/false | true | false |
| maxSamples | number \| null | ≥1 or null | 100 | null |

### Gradient Parameters

| Parameter | Type | Range | Default (Iris) | Default (Income) |
|-----------|------|-------|----------------|------------------|
| loss | enum | log_loss | log_loss | log_loss |
| learningRate | number | 0.01-1.0 | 0.2 | 0.1 |
| maxIter | number | ≥1 | 200 | 200 |
| maxLeafNodes | number \| null | ≥2 or null | 31 | 31 |
| maxDepth | number \| null | ≥1 or null | 4 | 6 |
| minSamplesLeaf | number | ≥1 | 1 | 20 |
| maxBins | number | 2-255 | 255 | 255 |
| earlyStopping | boolean \| 'auto' | true/false/auto | false | auto |

---

## Error Handling

### Frontend Errors

1. **Network Error**: Display retry button with offline indicator
2. **Validation Error**: Highlight invalid fields with inline error messages
3. **API Error**: Display ErrorDisplay component with full details

### API Errors

| Code | HTTP Status | Message |
|------|-------------|---------|
| INVALID_PARAMS | 400 | Invalid request parameters |
| SCRIPT_NOT_FOUND | 500 | Training script not found |
| SCRIPT_EXECUTION_ERROR | 500 | Script failed to execute |
| INVALID_JSON_OUTPUT | 500 | Script did not return valid JSON |
| TIMEOUT | 500 | Script execution timed out |
| UNKNOWN_ERROR | 500 | An unexpected error occurred |

### Python Script Errors

When `--json` flag is present and an error occurs, scripts should output:

```json
{
  "error": true,
  "message": "Error description",
  "traceback": "Full Python traceback"
}
```

Exit code should be non-zero for errors.

---

## Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tailwind-variants": "^0.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

---

## File Structure Summary

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       └── train/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   ├── DatasetSelector.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── DatasetParams.tsx
│   │   ├── ModelParams.tsx
│   │   ├── TrainButton.tsx
│   │   ├── ResultsDisplay.tsx
│   │   └── ErrorDisplay.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   ├── useParamsCache.ts
│   │   └── useTraining.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── storage.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   └── types/
│       ├── dataset.ts
│       ├── model.ts
│       ├── params.ts
│       └── api.ts
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Implementation Notes

### Running the Frontend

The frontend should be placed in a `frontend/` directory at the project root. It can be started with:

```bash
cd frontend
npm install
npm run dev
```

This will start the Next.js development server, typically on `http://localhost:3000`.

### Python Script Location

The API route assumes Python scripts are in the parent directory (`../` from `frontend/`). This can be configured via environment variable:

```env
SCRIPTS_DIR=/path/to/d-trees-and-forests
```

### CORS and Security

- The API route runs server-side, so no CORS issues
- Input validation prevents command injection
- Script execution is sandboxed to known scripts only
- Timeout prevents long-running processes
