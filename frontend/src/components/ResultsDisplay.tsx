'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, Badge, Tabs, Modal } from './ui';
import { ImageGallery } from './ImageGallery';
import type { TrainResult } from '@/types/api';

interface ResultsDisplayProps {
  result: TrainResult;
  isLoading?: boolean;
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface FeatureImportanceBarProps {
  name: string;
  value: number;
}

function FeatureImportanceBar({ name, value }: FeatureImportanceBarProps) {
  const percentage = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-32 truncate" title={name}>
        {name}
      </span>
      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded"
          style={{
            width: `${percentage}%`,
            opacity: Math.max(0.2, value),
          }}
        />
      </div>
      <span className="text-sm text-gray-600 w-12 text-right">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

interface SortableColumn {
  key: string;
  direction: 'asc' | 'desc';
}

interface DatasetTableProps {
  data: Record<string, unknown>[];
  labels?: string[];
  featureNames?: string[];
  pageSize?: number;
}

function DatasetTable({ data, labels, featureNames, pageSize = 10 }: DatasetTableProps) {
  const [sort, setSort] = useState<SortableColumn | null>(null);
  const [page, setPage] = useState(0);

  const columns = useMemo(() => {
    if (featureNames && featureNames.length > 0) return featureNames;
    if (data.length > 0) return Object.keys(data[0]);
    return [];
  }, [data, featureNames]);

  const sortedData = useMemo(() => {
    if (!sort) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const cmp = aVal < bVal ? -1 : 1;
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(data.length / pageSize);

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="text-left py-2 px-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-50"
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {sort?.key === col && (
                      <span className="text-blue-600">
                        {sort.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {labels && (
                <th className="text-left py-2 px-3 font-medium text-gray-600">
                  Label
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pagedData.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="py-2 px-3 text-gray-700 whitespace-nowrap">
                    {formatCellValue(row[col])}
                  </td>
                ))}
                {labels && (
                  <td className="py-2 px-3 text-gray-700 whitespace-nowrap">
                    {labels[page * pageSize + i]}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>
          Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data.length)} of {data.length} rows
        </span>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return '—';
    return Number.isInteger(value) ? String(value) : value.toFixed(4);
  }
  return String(value);
}

function ExpandIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
      />
    </svg>
  );
}

export function ResultsDisplay({ result, isLoading }: ResultsDisplayProps) {
  const { accuracy, classificationReport, modelInfo, featureImportance, executionTime, runId } = result;
  const [datasetView, setDatasetView] = useState<'train' | 'test'>('train');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sortedFeatureImportance = useMemo(() => {
    if (!featureImportance) return [];
    return Object.entries(featureImportance)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [featureImportance]);

  const hasDataset = result.trainData || result.testData;

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <div className="flex items-center gap-2">
          {isLoading && <Spinner />}
          <Badge variant={accuracy >= 0.9 ? 'success' : accuracy >= 0.7 ? 'warning' : 'error'}>
            {(accuracy * 100).toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>

      <Tabs
        tabs={[
          { id: 'results', label: 'Results' },
          ...(hasDataset ? [{ id: 'dataset', label: 'Dataset' }] : []),
        ]}
        defaultTab="results"
      >
        {(activeTab) => (
          <>
            {activeTab === 'results' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Classification Report</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 pr-4 font-medium text-gray-600">Class</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-600">Precision</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-600">Recall</th>
                          <th className="text-right py-2 px-4 font-medium text-gray-600">F1-Score</th>
                          <th className="text-right py-2 pl-4 font-medium text-gray-600">Support</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classificationReport.classes.map((cls) => (
                          <tr key={cls.label} className="border-b border-gray-100">
                            <td className="py-2 pr-4 text-gray-900">{cls.label}</td>
                            <td className="py-2 px-4 text-right text-gray-700">{cls.precision.toFixed(2)}</td>
                            <td className="py-2 px-4 text-right text-gray-700">{cls.recall.toFixed(2)}</td>
                            <td className="py-2 px-4 text-right text-gray-700">{cls.f1Score.toFixed(2)}</td>
                            <td className="py-2 pl-4 text-right text-gray-700">{cls.support}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-gray-300">
                          <td className="py-2 pr-4 font-medium text-gray-900">Accuracy</td>
                          <td className="py-2 px-4 text-right"></td>
                          <td className="py-2 px-4 text-right"></td>
                          <td className="py-2 px-4 text-right font-medium text-gray-900">
                            {classificationReport.accuracy.toFixed(2)}
                          </td>
                          <td className="py-2 pl-4 text-right text-gray-700">
                            {classificationReport.weightedAvg.support}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 pr-4 text-gray-600">Macro avg</td>
                          <td className="py-2 px-4 text-right text-gray-700">
                            {classificationReport.macroAvg.precision.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 text-right text-gray-700">
                            {classificationReport.macroAvg.recall.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 text-right text-gray-700">
                            {classificationReport.macroAvg.f1Score.toFixed(2)}
                          </td>
                          <td className="py-2 pl-4 text-right text-gray-700">
                            {classificationReport.macroAvg.support}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 text-gray-600">Weighted avg</td>
                          <td className="py-2 px-4 text-right text-gray-700">
                            {classificationReport.weightedAvg.precision.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 text-right text-gray-700">
                            {classificationReport.weightedAvg.recall.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 text-right text-gray-700">
                            {classificationReport.weightedAvg.f1Score.toFixed(2)}
                          </td>
                          <td className="py-2 pl-4 text-right text-gray-700">
                            {classificationReport.weightedAvg.support}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {modelInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Model Info</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Type: {modelInfo.type}</li>
                      {modelInfo.treeDepth !== undefined && <li>Tree Depth: {modelInfo.treeDepth}</li>}
                      {modelInfo.nLeaves !== undefined && <li>Number of Leaves: {modelInfo.nLeaves}</li>}
                      {modelInfo.nEstimators !== undefined && <li>Estimators: {modelInfo.nEstimators}</li>}
                      {modelInfo.oobScore !== undefined && <li>OOB Score: {(modelInfo.oobScore * 100).toFixed(2)}%</li>}
                      {modelInfo.nIterations !== undefined && <li>Iterations: {modelInfo.nIterations}</li>}
                    </ul>
                  </div>
                )}

                {sortedFeatureImportance.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Feature Importance</h4>
                    <div className="space-y-2">
                      {sortedFeatureImportance.map(({ name, value }) => (
                        <FeatureImportanceBar key={name} name={name} value={value} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Execution time: {(executionTime / 1000).toFixed(2)}s
                </div>
              </div>
            )}

            {activeTab === 'dataset' && hasDataset && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDatasetView('train')}
                      className={`px-3 py-1 text-sm rounded ${
                        datasetView === 'train'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Train ({result.trainData?.length ?? 0} rows)
                    </button>
                    <button
                      onClick={() => setDatasetView('test')}
                      className={`px-3 py-1 text-sm rounded ${
                        datasetView === 'test'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Test ({result.testData?.length ?? 0} rows)
                    </button>
                  </div>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Fullscreen"
                  >
                    <ExpandIcon />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {datasetView === 'train' && result.trainData && (
                    <DatasetTable
                      data={result.trainData}
                      labels={result.trainLabels}
                      featureNames={result.featureNames}
                    />
                  )}
                  {datasetView === 'test' && result.testData && (
                    <DatasetTable
                      data={result.testData}
                      labels={result.testLabels}
                      featureNames={result.featureNames}
                    />
                  )}
                </div>

                <Modal
                  isOpen={isFullscreen}
                  onClose={() => setIsFullscreen(false)}
                  title={`Dataset - ${datasetView === 'train' ? 'Train' : 'Test'}`}
                >
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDatasetView('train')}
                        className={`px-3 py-1 text-sm rounded ${
                          datasetView === 'train'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Train ({result.trainData?.length ?? 0} rows)
                      </button>
                      <button
                        onClick={() => setDatasetView('test')}
                        className={`px-3 py-1 text-sm rounded ${
                          datasetView === 'test'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Test ({result.testData?.length ?? 0} rows)
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      {datasetView === 'train' && result.trainData && (
                        <DatasetTable
                          data={result.trainData}
                          labels={result.trainLabels}
                          featureNames={result.featureNames}
                          pageSize={25}
                        />
                      )}
                      {datasetView === 'test' && result.testData && (
                        <DatasetTable
                          data={result.testData}
                          labels={result.testLabels}
                          featureNames={result.featureNames}
                          pageSize={25}
                        />
                      )}
                    </div>
                  </div>
                </Modal>
              </div>
            )}
          </>
        )}
      </Tabs>

    </Card>
  );
}

interface ImagesDisplayProps {
  runId?: string;
  compareId?: string;
}

export function ImagesDisplay({ runId, compareId }: ImagesDisplayProps) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Visuals</CardTitle>
      </CardHeader>
      <ImageGallery runId={runId} compareId={compareId} />
    </Card>
  );
}
