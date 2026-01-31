import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "public", "output");
const COMPARE_DIR = path.join(OUTPUT_DIR, "compare");

interface ModelInfo {
  runId: string;
  model: string;
  name: string | null;
}

interface CompareHistoryRun {
  compareId: string;
  dataset: string;
  timestamp: number;
  name: string | null;
  mask: number;
  impute: boolean;
  models: ModelInfo[];
}

interface CompareRuntime {
  compare_id: string;
  dataset: string;
  mask: number;
  impute: boolean;
  name: string | null;
  models: Array<{ runId: string; model: string }>;
}

interface TrainRuntime {
  name?: string;
}

function getModelName(runId: string): string | null {
  try {
    const runtimePath = path.join(OUTPUT_DIR, runId, "runtime.json");
    if (fs.existsSync(runtimePath)) {
      const content = fs.readFileSync(runtimePath, "utf-8");
      const runtime: TrainRuntime = JSON.parse(content);
      return runtime.name || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const datasetFilter = searchParams.get("dataset");

  try {
    // Check if compare directory exists
    if (!fs.existsSync(COMPARE_DIR)) {
      return NextResponse.json({ runs: [] });
    }

    // List all compare directories
    const entries = fs.readdirSync(COMPARE_DIR, { withFileTypes: true });
    const runs: CompareHistoryRun[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // Validate directory name is a 10-digit timestamp
      if (!/^\d{10}$/.test(entry.name)) continue;

      const runtimePath = path.join(COMPARE_DIR, entry.name, "runtime.json");
      if (!fs.existsSync(runtimePath)) continue;

      try {
        const content = fs.readFileSync(runtimePath, "utf-8");
        const runtime: CompareRuntime = JSON.parse(content);

        // Filter by dataset if specified
        if (datasetFilter && runtime.dataset !== datasetFilter) continue;

        // Enrich model info with names from train runs
        const models: ModelInfo[] = runtime.models.map((m) => ({
          runId: m.runId,
          model: m.model,
          name: getModelName(m.runId),
        }));

        runs.push({
          compareId: entry.name,
          dataset: runtime.dataset,
          timestamp: parseInt(entry.name, 10),
          name: runtime.name || null,
          mask: runtime.mask || 0,
          impute: runtime.impute || false,
          models,
        });
      } catch {
        // Skip invalid entries
      }
    }

    // Sort by timestamp descending (newest first)
    runs.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ runs });
  } catch {
    return NextResponse.json(
      { error: "Failed to list compare history" },
      { status: 500 }
    );
  }
}
