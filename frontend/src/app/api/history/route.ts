import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface HistoryRun {
  runId: string;
  model: string;
  dataset: string;
  accuracy: number;
  timestamp: number;
  name?: string;
}

export interface HistoryResponse {
  runs: HistoryRun[];
}

const OUTPUT_DIR = path.join(process.cwd(), "public", "output");

export async function GET(
  request: NextRequest,
): Promise<NextResponse<HistoryResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const modelFilter = searchParams.get("model");
  const datasetFilter = searchParams.get("dataset");

  const runs: HistoryRun[] = [];

  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return NextResponse.json({ runs: [] });
    }

    const dirs = fs.readdirSync(OUTPUT_DIR);

    for (const dir of dirs) {
      // Check if directory name is a 10-digit timestamp
      if (!/^\d{10}$/.test(dir)) continue;

      const runDir = path.join(OUTPUT_DIR, dir);
      const stat = fs.statSync(runDir);
      if (!stat.isDirectory()) continue;

      // Look for .id files matching pattern: <model>_<dataset>_<score>.id
      const files = fs.readdirSync(runDir);
      for (const file of files) {
        if (!file.endsWith(".id")) continue;

        // Match pattern: <model>_<dataset>_<score>[_<name>].id
        // Score is stored as accuracy * 1000000 (e.g., 0.98 -> 980000)
        const match = file.match(/^([^_]+)_([^_]+)_(\d+)(?:_(.+))?\.id$/);
        if (!match) continue;

        const [, model, dataset, scoreStr, name] = match;
        const accuracy = parseInt(scoreStr, 10) / 1000000;
        const timestamp = parseInt(dir, 10);

        // Apply filters if provided
        if (modelFilter && model !== modelFilter) continue;
        if (datasetFilter && dataset !== datasetFilter) continue;

        runs.push({
          runId: dir,
          model,
          dataset,
          accuracy,
          timestamp,
          name,
        });
      }
    }

    // Sort by timestamp descending (most recent first)
    runs.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ runs });
  } catch {
    return NextResponse.json({ runs: [] });
  }
}
