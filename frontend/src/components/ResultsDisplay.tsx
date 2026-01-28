'use client';

import { Card, CardHeader, CardTitle, Badge } from './ui';
import type { TrainResult } from '@/types/api';

interface ResultsDisplayProps {
  result: TrainResult;
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const { accuracy, classificationReport, modelInfo, executionTime } = result;

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={accuracy >= 0.9 ? 'success' : accuracy >= 0.7 ? 'warning' : 'error'}>
            {(accuracy * 100).toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>

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

        <div className="text-sm text-gray-500">
          Execution time: {(executionTime / 1000).toFixed(2)}s
        </div>
      </div>
    </Card>
  );
}
