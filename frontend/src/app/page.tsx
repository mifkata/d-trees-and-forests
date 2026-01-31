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
import { ControlledTabs, Spinner } from "@/components/ui";
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
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runName, setRunName] = useState<string | undefined>(undefined);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [isRenamingLoading, setIsRenamingLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const hasNavigatedForResult = useRef<string | null>(null);
  const loadedRunId = useRef<string | null>(null);
  const lastAutoLoadCombo = useRef<string | null>(null);

  // Load run data when run_id query param is present or changes
  useEffect(() => {
    if (!runId || !isHydrated || loadedRunId.current === runId) return;

    const abortController = new AbortController();
    const targetRunId = runId; // Capture for async closure

    async function loadRunData() {
      setIsLoadingRun(true);
      setLoadError(null);
      setRunName(undefined);

      try {
        // Fetch run name from history API
        const historyRes = await fetch("/api/history");
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          const run = historyData.runs.find(
            (r: { runId: string }) => r.runId === runId
          );
          if (run?.name) {
            setRunName(run.name);
          }
        }

        // Load runtime.json
        const runtimeRes = await fetch(`/output/${targetRunId}/runtime.json`, {
          signal: abortController.signal,
        });
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

        // Mark this combo as loaded to prevent auto-load from overriding
        lastAutoLoadCombo.current = `${runtime.dataset}_${runtime.model}`;

        // Load result.json
        const resultRes = await fetch(`/output/${targetRunId}/result.json`, {
          signal: abortController.signal,
        });
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
            runId: targetRunId || undefined,
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

          // Mark as successfully loaded and navigated
          loadedRunId.current = targetRunId;
          hasNavigatedForResult.current = targetRunId;
          setResult(trainResult);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return;
        setLoadError(err instanceof Error ? err.message : "Failed to load run");
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingRun(false);
        }
      }
    }

    loadRunData();

    return () => {
      abortController.abort();
    };
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

  // Auto-load latest run when in Train mode and:
  // 1. Initial load with no run_id
  // 2. Switching from Compare to Train mode
  // 3. Changing dataset or model
  useEffect(() => {
    // Only auto-load in Train mode when hydrated
    if (!isHydrated || isCompareMode) return;

    const combo = `${dataset}_${model}`;

    // Skip if we already loaded this combo (prevents re-fetching when only runId changes)
    if (lastAutoLoadCombo.current === combo) return;

    const abortController = new AbortController();

    async function loadLatestRun() {
      setIsLoadingLatest(true);
      try {
        const res = await fetch(`/api/history?model=${model}&dataset=${dataset}`, {
          signal: abortController.signal,
        });
        const data = await res.json();
        const runs = data.runs || [];

        if (runs.length > 0) {
          // Navigate to the latest run
          const latestRunId = runs[0].runId;
          lastAutoLoadCombo.current = combo;
          hasNavigatedForResult.current = latestRunId;
          // Clear old state to prevent stale data and effect conflicts
          loadedRunId.current = null;
          setResult(null);
          setIsLoadingLatest(false);
          router.replace(`/?run_id=${latestRunId}`);
        } else {
          // No history, just mark as loaded and clear any existing result
          lastAutoLoadCombo.current = combo;
          loadedRunId.current = null;
          setResult(null);
          router.replace('/');
          setIsLoadingLatest(false);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return;
        lastAutoLoadCombo.current = combo;
        setIsLoadingLatest(false);
      }
    }

    loadLatestRun();

    return () => {
      abortController.abort();
    };
  }, [isHydrated, isCompareMode, dataset, model, router, setResult]);

  const handleRenameSubmit = useCallback(async () => {
    if (!runId || !editingNameValue.trim()) {
      setIsEditingName(false);
      setEditingNameValue("");
      setRenameError(null);
      return;
    }

    const sanitizedName = editingNameValue.trim().replace(/ /g, "_");
    setIsRenamingLoading(true);
    setRenameError(null);

    try {
      const response = await fetch("/api/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, name: sanitizedName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename");
      }

      setRunName(sanitizedName);
      setIsEditingName(false);
      setEditingNameValue("");
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setIsRenamingLoading(false);
    }
  }, [runId, editingNameValue]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isCompareMode) {
        runCompare();
      } else {
        train({
          dataset,
          model,
          datasetParams: {
            ...datasetParams,
            impute: datasetParams.mask > 0 && datasetParams.impute,
          },
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

  if (!isHydrated || isLoadingRun || isLoadingLatest || loadError) {
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
            <div className="text-sm text-gray-500 font-mono">
              <span>
                Run:{" "}
                {isEditingName ? (
                  <span className="inline-flex flex-col">
                    <input
                      type="text"
                      value={editingNameValue}
                      onChange={(e) => {
                        setEditingNameValue(e.target.value);
                        setRenameError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRenameSubmit();
                        } else if (e.key === "Escape") {
                          setIsEditingName(false);
                          setEditingNameValue("");
                          setRenameError(null);
                        }
                      }}
                      onBlur={() => {
                        if (!renameError) {
                          setIsEditingName(false);
                          setEditingNameValue("");
                        }
                      }}
                      placeholder={runId}
                      maxLength={50}
                      className={`bg-transparent border-b focus:outline-none px-1 min-w-40 ${
                        renameError
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-400 focus:border-blue-500"
                      }`}
                      style={{ width: `${Math.max(editingNameValue.length, runId.length) + 2}ch` }}
                      autoFocus
                      disabled={isRenamingLoading}
                    />
                    {renameError && (
                      <span className="text-xs text-red-500 mt-1">{renameError}</span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span
                      onClick={() => {
                        setEditingNameValue(runName?.replace(/_/g, " ") ?? "");
                        setIsEditingName(true);
                      }}
                      className="cursor-pointer hover:text-gray-700 hover:underline"
                      title="Click to rename"
                    >
                      {runName ? runName.replace(/_/g, " ") : runId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNameValue(runName?.replace(/_/g, " ") ?? "");
                        setIsEditingName(true);
                      }}
                      className="p-0.5 text-gray-400 hover:text-gray-600"
                      title="Rename run"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </span>
                )}
              </span>
            </div>
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

            {/* Loading state for Train */}
            {!isCompareMode && isLoading && !result && (
              <Card>
                <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
                  <Spinner className="h-5 w-5" />
                  <p>Loading...</p>
                </div>
              </Card>
            )}

            {/* Empty state for Train */}
            {!isCompareMode && !isLoading && !error && !result && (
              <Card>
                <div className="text-center py-12 text-gray-500">
                  <p>Configure parameters and click Train to see results</p>
                </div>
              </Card>
            )}

            {/* Loading state for Compare */}
            {isCompareMode && isComparing && !compareResult && (
              <Card>
                <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
                  <Spinner className="h-5 w-5" />
                  <p>Loading...</p>
                </div>
              </Card>
            )}

            {/* Empty state for Compare */}
            {isCompareMode && !isComparing && !compareError && !compareResult && (
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
