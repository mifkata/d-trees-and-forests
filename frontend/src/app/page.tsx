"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParamsCache, useTraining, useCompare } from "@/hooks";
import {
  Card,
  DatasetSelector,
  ModelSelector,
  DatasetParams,
  CompareDatasetParams,
  ModelParams,
  TrainButton,
  ResultsDisplay,
  ImagesDisplay,
  ErrorDisplay,
  CompareModelsTab,
  CompareButton,
  CompareResults,
} from "@/components";
import { ControlledTabs } from "@/components/ui";
import type { TrainResult } from "@/types/api";
import type { DatasetId } from "@/types/dataset";
import type { ModelId } from "@/types/model";
import type { ModelParams as ModelParamsType } from "@/types/params";

interface RuntimeJson {
  run_id: string;
  dataset: DatasetId;
  model: ModelId;
  datasetParams: {
    mask: number;
    split: number;
    impute: boolean;
    ignore_columns: number[];
  };
  modelParams: Record<string, unknown>;
}

type Mode = "train" | "compare";
type TrainTab = "dataset" | "model";
type CompareTab = "dataset" | "models";

function HomeContent() {
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
    loadRun,
    isHydrated,
  } = useParamsCache();

  const { isLoading, result, error, train, clearError, setResult } =
    useTraining();

  // Persist tab states in localStorage
  const [mode, setModeState] = useState<Mode>("train");
  const [trainTab, setTrainTabState] = useState<TrainTab>("dataset");
  const [compareTab, setCompareTabState] = useState<CompareTab>("dataset");

  // Load saved tab states on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("tab_mode") as Mode | null;
    const savedTrainTab = localStorage.getItem("tab_train") as TrainTab | null;
    const savedCompareTab = localStorage.getItem("tab_compare") as CompareTab | null;
    if (savedMode === "train" || savedMode === "compare") setModeState(savedMode);
    if (savedTrainTab === "dataset" || savedTrainTab === "model") setTrainTabState(savedTrainTab);
    if (savedCompareTab === "dataset" || savedCompareTab === "models") setCompareTabState(savedCompareTab);
  }, []);

  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem("tab_mode", newMode);
  }, []);

  const setTrainTab = useCallback((newTab: TrainTab) => {
    setTrainTabState(newTab);
    localStorage.setItem("tab_train", newTab);
  }, []);

  const setCompareTab = useCallback((newTab: CompareTab) => {
    setCompareTabState(newTab);
    localStorage.setItem("tab_compare", newTab);
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get("run_id");

  const isCompareMode = mode === "compare";
  const isModelsTabActive = isCompareMode && compareTab === "models";

  const {
    selection,
    updateSelection,
    datasetParams: compareDatasetParams,
    setDatasetParams: setCompareDatasetParams,
    resetDatasetParams: resetCompareDatasetParams,
    isComparing,
    compareResult,
    compareError,
    runCompare,
    clearCompareResult,
    isSelectionComplete,
    historyTree,
    historyForest,
    historyGradient,
    isLoadingHistory,
  } = useCompare({ dataset, isCompareMode, isModelsTabActive });

  const [isLoadingRun, setIsLoadingRun] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasNavigatedForResult = useRef<string | null>(null);
  const loadedRunId = useRef<string | null>(null);

  // Load run data when run_id query param is present or changes
  useEffect(() => {
    if (!runId || !isHydrated || loadedRunId.current === runId) return;

    async function loadRunData() {
      loadedRunId.current = runId;
      setIsLoadingRun(true);
      setLoadError(null);

      try {
        // Load runtime.json
        const runtimeRes = await fetch(`/output/${runId}/runtime.json`);
        if (!runtimeRes.ok) {
          throw new Error("Run not found");
        }
        const runtime: RuntimeJson = await runtimeRes.json();

        // Set form state from runtime atomically to avoid closure issues
        loadRun({
          dataset: runtime.dataset,
          model: runtime.model,
          datasetParams: {
            mask: runtime.datasetParams.mask,
            split: runtime.datasetParams.split,
            impute: runtime.datasetParams.impute,
            ignore_columns: runtime.datasetParams.ignore_columns || [],
          },
          modelParams: runtime.modelParams as unknown as ModelParamsType,
        });

        // Load result.json
        const resultRes = await fetch(`/output/${runId}/result.json`);
        if (resultRes.ok) {
          const resultData = await resultRes.json();
          // Transform to TrainResult format
          const trainResult: TrainResult = {
            accuracy: resultData.accuracy,
            accuracyPercent: `${(resultData.accuracy * 100).toFixed(2)}%`,
            classificationReport: {
              classes: Object.entries(resultData.classification_report)
                .filter(
                  ([key]) =>
                    !["accuracy", "macro avg", "weighted avg"].includes(key),
                )
                .map(([label, metrics]: [string, unknown]) => {
                  const m = metrics as {
                    precision: number;
                    recall: number;
                    "f1-score": number;
                    support: number;
                  };
                  return {
                    label,
                    precision: m.precision,
                    recall: m.recall,
                    f1Score: m["f1-score"],
                    support: m.support,
                  };
                }),
              accuracy:
                resultData.classification_report.accuracy ||
                resultData.accuracy,
              macroAvg: {
                precision:
                  resultData.classification_report["macro avg"].precision,
                recall: resultData.classification_report["macro avg"].recall,
                f1Score:
                  resultData.classification_report["macro avg"]["f1-score"],
                support: resultData.classification_report["macro avg"].support,
              },
              weightedAvg: {
                precision:
                  resultData.classification_report["weighted avg"].precision,
                recall: resultData.classification_report["weighted avg"].recall,
                f1Score:
                  resultData.classification_report["weighted avg"]["f1-score"],
                support:
                  resultData.classification_report["weighted avg"].support,
              },
            },
            executionTime: resultData.execution_time || 0,
            runId: runId || undefined,
          };

          if (resultData.model_info) {
            trainResult.modelInfo = {
              type: resultData.model_info.type,
              nIterations: resultData.model_info.n_iterations,
              treeDepth: resultData.model_info.tree_depth,
              nLeaves: resultData.model_info.n_leaves,
              nEstimators: resultData.model_info.n_estimators,
              oobScore: resultData.model_info.oob_score,
            };
          }

          if (resultData.feature_importance) {
            trainResult.featureImportance = resultData.feature_importance;
          }

          if (resultData.params) {
            trainResult.params = resultData.params;
          }

          if (resultData.train_data) {
            trainResult.trainData = resultData.train_data;
          }

          if (resultData.test_data) {
            trainResult.testData = resultData.test_data;
          }

          if (resultData.train_labels) {
            trainResult.trainLabels = resultData.train_labels;
          }

          if (resultData.test_labels) {
            trainResult.testLabels = resultData.test_labels;
          }

          if (resultData.feature_names) {
            trainResult.featureNames = resultData.feature_names;
          }

          // Mark as already navigated to prevent navigation effect from triggering
          hasNavigatedForResult.current = runId;
          setResult(trainResult);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load run");
      } finally {
        setIsLoadingRun(false);
      }
    }

    loadRunData();
  }, [
    runId,
    isHydrated,
    loadRun,
    setResult,
  ]);

  // Navigate to run page when training completes (new result from training, not loaded from file)
  useEffect(() => {
    if (
      result?.runId &&
      result.runId !== runId &&
      hasNavigatedForResult.current !== result.runId
    ) {
      hasNavigatedForResult.current = result.runId;
      router.replace(`/?run_id=${result.runId}`);
    }
  }, [result?.runId, runId, router]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isCompareMode) {
        runCompare();
      } else {
        train({
          dataset,
          model,
          datasetParams,
          modelParams,
        });
      }
    },
    [isCompareMode, runCompare, train, dataset, model, datasetParams, modelParams],
  );

  // Redirect to home when run fails to load
  useEffect(() => {
    if (loadError) {
      router.replace('/');
    }
  }, [loadError, router]);

  if (!isHydrated || isLoadingRun || loadError) {
    return (
      <main className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            Model Trainer
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
      <div className="mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Model Trainer</h1>
          {runId && !isCompareMode && (
            <span className="text-sm text-gray-500 font-mono">
              Run: {runId}
            </span>
          )}
        </div>

        <div className="flex gap-6">
          {/* Left Column - Form */}
          <form onSubmit={handleSubmit} className="space-y-6 w-[920px]">
            {/* Mode Tabs + Dataset/Model selectors */}
            <Card>
              <ControlledTabs
                tabs={[
                  { id: "train", label: "Train" },
                  { id: "compare", label: "Compare" },
                ]}
                activeTab={mode}
                onTabChange={(tab) => setMode(tab as Mode)}
              >
                {isCompareMode ? (
                  <DatasetSelector value={dataset} onChange={setDataset} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DatasetSelector value={dataset} onChange={setDataset} />
                    <ModelSelector
                      value={model}
                      onChange={setModel}
                      dataset={dataset}
                    />
                  </div>
                )}
              </ControlledTabs>
            </Card>

            {/* Sub-tabs: Different for Train vs Compare */}
            <Card>
              {isCompareMode ? (
                <ControlledTabs
                  tabs={[
                    { id: "dataset", label: "Dataset" },
                    { id: "models", label: "Models" },
                  ]}
                  activeTab={compareTab}
                  onTabChange={(tab) => setCompareTab(tab as CompareTab)}
                >
                  {compareTab === "dataset" && (
                    <CompareDatasetParams
                      params={compareDatasetParams}
                      dataset={dataset}
                      onChange={setCompareDatasetParams}
                      onReset={resetCompareDatasetParams}
                    />
                  )}
                  {compareTab === "models" && (
                    <CompareModelsTab
                      selection={selection}
                      onSelectionChange={updateSelection}
                      historyTree={historyTree}
                      historyForest={historyForest}
                      historyGradient={historyGradient}
                      isLoadingHistory={isLoadingHistory}
                    />
                  )}
                </ControlledTabs>
              ) : (
                <ControlledTabs
                  tabs={[
                    { id: "dataset", label: "Dataset" },
                    { id: "model", label: "Model" },
                  ]}
                  activeTab={trainTab}
                  onTabChange={(tab) => setTrainTab(tab as TrainTab)}
                >
                  {trainTab === "dataset" && (
                    <DatasetParams
                      params={datasetParams}
                      dataset={dataset}
                      onChange={setDatasetParams}
                      onReset={resetDatasetParams}
                    />
                  )}
                  {trainTab === "model" && (
                    <ModelParams
                      model={model}
                      params={modelParams}
                      onChange={setModelParams}
                      onReset={resetModelParams}
                    />
                  )}
                </ControlledTabs>
              )}
            </Card>

            <Card padding="sm">
              {isCompareMode ? (
                <CompareButton
                  loading={isComparing}
                  disabled={isComparing || !isSelectionComplete}
                  onClick={runCompare}
                />
              ) : (
                <TrainButton loading={isLoading} disabled={isLoading} />
              )}
            </Card>
          </form>

          {/* Right Column - Output */}
          <div className="space-y-6 w-full">
            {/* Training error */}
            {!isCompareMode && error && (
              <ErrorDisplay error={error} onDismiss={clearError} />
            )}

            {/* Compare error */}
            {isCompareMode && compareError && (
              <ErrorDisplay error={compareError} onDismiss={clearCompareResult} />
            )}

            {/* Compare results */}
            {isCompareMode && compareResult && (
              <CompareResults result={compareResult} />
            )}

            {/* Training results */}
            {!isCompareMode && result && (
              <div className="grid grid-cols-2 xl:grid-cols-2 gap-6">
                <ResultsDisplay result={result} isLoading={isLoading} />
                {result.runId && <ImagesDisplay runId={result.runId} />}
              </div>
            )}

            {/* Empty state */}
            {!isCompareMode && !error && !result && (
              <Card>
                <div className="text-center py-12 text-gray-500">
                  <p>Configure parameters and click Train to see results</p>
                </div>
              </Card>
            )}

            {isCompareMode && !compareError && !compareResult && (
              <Card>
                <div className="text-center py-12 text-gray-500">
                  <p>Select three models from history and click Compare</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Model Trainer</h1>
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

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  );
}
