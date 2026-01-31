import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import type { ErrorCode } from "@/types/api";

const SCRIPTS_DIR =
  process.env.SCRIPTS_DIR || path.resolve(process.cwd(), "..");
const SCRIPT_TIMEOUT = 600000; // 10 minutes for comparison
const OUTPUT_DIR = path.join(process.cwd(), "public", "output");

interface CompareRequest {
  dataset: string;
  tree: string;
  forest: string;
  gradient: string;
  mask?: number;
  impute?: boolean;
  ignore_columns?: number[];
}

interface ModelResult {
  runId: string;
  trainAccuracy: number;
  compareAccuracy: number;
}

interface CompareResponse {
  success: boolean;
  data?: {
    images: string[];
    models: {
      tree: ModelResult | null;
      forest: ModelResult | null;
      gradient: ModelResult | null;
    };
  };
  error?: {
    message: string;
    code: ErrorCode;
    details?: string;
    stackTrace?: string;
  };
}

class CompareError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: string,
    public stackTrace?: string,
  ) {
    super(message);
    this.name = "CompareError";
  }
}

function extractStackTrace(stderr: string): string | undefined {
  const lines = stderr.split("\n");
  const traceStart = lines.findIndex((line) => line.includes("Traceback"));
  if (traceStart === -1) return undefined;
  return lines.slice(traceStart).join("\n");
}

interface ScriptResult {
  stdout: string;
  stderr: string;
  code: number;
}

async function executeScript(args: string[]): Promise<ScriptResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, "compare.py");

    const child = spawn("python", ["-W", "ignore", scriptPath, ...args], {
      cwd: SCRIPTS_DIR,
      timeout: SCRIPT_TIMEOUT,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(
          new CompareError(
            `Compare script exited with code ${code}`,
            "SCRIPT_EXECUTION_ERROR",
            stderr || stdout,
            extractStackTrace(stderr),
          ),
        );
      }
    });

    child.on("error", (err) => {
      reject(
        new CompareError(
          `Failed to execute compare script: ${err.message}`,
          "SCRIPT_NOT_FOUND",
          err.message,
        ),
      );
    });
  });
}

async function getModelAccuracy(runId: string): Promise<number | null> {
  try {
    const resultPath = path.join(OUTPUT_DIR, runId, "result.json");
    const content = await fs.readFile(resultPath, "utf-8");
    const result = JSON.parse(content);
    return result.accuracy;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CompareResponse>> {
  try {
    const body: CompareRequest = await request.json();
    const { dataset, tree, forest, gradient, mask, impute, ignore_columns } = body;

    // Validate required fields
    if (!dataset || !tree || !forest || !gradient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "All model IDs (tree, forest, gradient) are required",
            code: "INVALID_PARAMS",
          },
        },
        { status: 400 },
      );
    }

    // Build args for compare.py
    const args = [
      "--dataset",
      dataset,
      "--tree",
      tree,
      "--forest",
      forest,
      "--gradient",
      gradient,
    ];

    // Add optional mask parameter
    if (mask !== undefined && mask > 0) {
      args.push("--mask", String(mask));
    }

    // Add optional impute flag
    if (impute) {
      args.push("--impute");
    }

    // Add optional ignore_columns parameter
    if (ignore_columns && ignore_columns.length > 0) {
      args.push("--ignore-columns", ignore_columns.join(","));
    }

    const scriptResult = await executeScript(args);

    // Parse JSON output from compare.py
    // The script outputs log messages followed by a JSON object at the end
    const stdout = scriptResult.stdout;

    // Find the last complete JSON object (starts with { and ends with })
    // We need to find matching braces, not just the last { and }
    let braceCount = 0;
    let jsonStart = -1;
    let jsonEnd = -1;

    for (let i = stdout.length - 1; i >= 0; i--) {
      if (stdout[i] === '}') {
        if (braceCount === 0) {
          jsonEnd = i + 1;
        }
        braceCount++;
      } else if (stdout[i] === '{') {
        braceCount--;
        if (braceCount === 0) {
          jsonStart = i;
          break;
        }
      }
    }

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new CompareError(
        "No JSON output from compare script",
        "SCRIPT_EXECUTION_ERROR",
        `Raw output:\n${stdout}`,
      );
    }

    const jsonString = stdout.slice(jsonStart, jsonEnd);
    let compareOutput;
    try {
      compareOutput = JSON.parse(jsonString);
    } catch (parseError) {
      throw new CompareError(
        "Failed to parse JSON from compare script",
        "SCRIPT_EXECUTION_ERROR",
        `Parse error: ${parseError}\n\nJSON string:\n${jsonString}\n\nFull stdout:\n${stdout}\n\nStderr:\n${scriptResult.stderr}`,
      );
    }

    // Check if compare.py returned an error
    if (!compareOutput.success) {
      throw new CompareError(
        compareOutput.error?.message || "Compare failed",
        "SCRIPT_EXECUTION_ERROR",
        compareOutput.error?.details || "Unknown error",
      );
    }

    const models = compareOutput.models;

    // Check for output images
    const images: string[] = [];
    const imageFiles = [
      "accuracy_comparison.png",
      "accuracy_comparison_impute.png",
    ];

    for (const file of imageFiles) {
      const imagePath = path.join(OUTPUT_DIR, file);
      try {
        await fs.access(imagePath);
        images.push(`/output/${file}`);
      } catch {
        // Image doesn't exist, skip
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        images,
        models: {
          tree: models.tree ? {
            runId: models.tree.runId,
            trainAccuracy: models.tree.trainAccuracy,
            compareAccuracy: models.tree.compareAccuracy,
          } : null,
          forest: models.forest ? {
            runId: models.forest.runId,
            trainAccuracy: models.forest.trainAccuracy,
            compareAccuracy: models.forest.compareAccuracy,
          } : null,
          gradient: models.gradient ? {
            runId: models.gradient.runId,
            trainAccuracy: models.gradient.trainAccuracy,
            compareAccuracy: models.gradient.compareAccuracy,
          } : null,
        },
      },
    });
  } catch (error) {
    if (error instanceof CompareError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            stackTrace: error.stackTrace,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "An unexpected error occurred",
          code: "UNKNOWN_ERROR",
          details: String(error),
        },
      },
      { status: 500 },
    );
  }
}
