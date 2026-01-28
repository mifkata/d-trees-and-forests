'use client';

import { useParamsCache, useTraining } from '@/hooks';
import {
  Card,
  DatasetSelector,
  ModelSelector,
  DatasetParams,
  ModelParams,
  TrainButton,
  ResultsDisplay,
  ErrorDisplay,
} from '@/components';

export default function Home() {
  const {
    dataset,
    model,
    datasetParams,
    modelParams,
    setDataset,
    setModel,
    setDatasetParams,
    setModelParams,
    resetDatasetParams,
    resetModelParams,
    isHydrated,
  } = useParamsCache();

  const { isLoading, result, error, train, clearError } = useTraining();

  const handleTrain = () => {
    train({
      dataset,
      model,
      datasetParams,
      modelParams,
    });
  };

  if (!isHydrated) {
    return (
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            D-Trees & Random Forests
          </h1>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          D-Trees & Random Forests
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <DatasetSelector
              value={dataset}
              onChange={setDataset}
              disabled={isLoading}
            />
          </Card>
          <Card>
            <ModelSelector
              value={model}
              onChange={setModel}
              disabled={isLoading}
            />
          </Card>
        </div>

        <DatasetParams
          params={datasetParams}
          onChange={setDatasetParams}
          onReset={resetDatasetParams}
          disabled={isLoading}
        />

        <ModelParams
          model={model}
          params={modelParams}
          onChange={setModelParams}
          onReset={resetModelParams}
          disabled={isLoading}
        />

        <Card padding="sm">
          <TrainButton
            onClick={handleTrain}
            loading={isLoading}
          />
        </Card>

        {error && (
          <ErrorDisplay error={error} onDismiss={clearError} />
        )}

        {result && (
          <ResultsDisplay result={result} />
        )}
      </div>
    </main>
  );
}
