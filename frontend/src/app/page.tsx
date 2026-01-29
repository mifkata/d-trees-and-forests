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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            D-Trees & Random Forests
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          D-Trees & Random Forests
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <DatasetSelector
                  value={dataset}
                  onChange={setDataset}
                />
              </Card>
              <Card>
                <ModelSelector
                  value={model}
                  onChange={setModel}
                />
              </Card>
            </div>

            <DatasetParams
              params={datasetParams}
              onChange={setDatasetParams}
              onReset={resetDatasetParams}
            />

            <ModelParams
              model={model}
              params={modelParams}
              onChange={setModelParams}
              onReset={resetModelParams}
            />

            <Card padding="sm">
              <TrainButton loading={isLoading} disabled={isLoading} />
            </Card>
          </form>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {error && (
              <ErrorDisplay error={error} onDismiss={clearError} />
            )}

            {result && (
              <ResultsDisplay result={result} isLoading={isLoading} />
            )}

            {!error && !result && (
              <Card>
                <div className="text-center py-12 text-gray-500">
                  <p>Configure parameters and click Train to see results</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
