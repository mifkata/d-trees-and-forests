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
  models: string[];  // Array of run IDs
  mask?: number;
  impute?: boolean;
  // ignore_columns is not used - determined from model's runtime.json
}

interface ModelResult {
  runId: string;
  model: 'tree' | 'forest' | 'gradient' | 'hist-gradient';
  columns: number[];
  trainAccuracy: number;
  compareAccuracy: number;
  imputed?: boolean;
}

interface CompareResponse {
  success: boolean;
  data?: {
    compareId: string;
    images: string[];
    models: ModelResult[];  // Array format
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

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CompareResponse>> {
  try {
    const body: CompareRequest = await request.json();
    const { dataset, models: modelIds, mask, impute } = body;

    // Validate required fields
    if (!dataset || !modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Dataset and at least one model ID are required",
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
      "--models",
      modelIds.join(","),
    ];

    // Add optional mask parameter
    if (mask !== undefined && mask > 0) {
      args.push("--mask", String(mask));
    }

    // Add optional impute flag
    if (impute) {
      args.push("--impute");
    }

    // ignore_columns is not passed - determined from model's runtime.json

    // Always generate images for frontend
    args.push("--images");

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

    const modelResults = compareOutput.models as ModelResult[];
    const compareId = compareOutput.compareId;

    // Check for output images in compare directory
    const images: string[] = [];
    const compareDir = path.join(OUTPUT_DIR, "compare", compareId);

    try {
      const files = await fs.readdir(compareDir);
      for (const file of files) {
        if (file.endsWith(".png")) {
          images.push(`/output/compare/${compareId}/${file}`);
        }
      }
    } catch {
      // Directory doesn't exist or no images, continue with empty array
    }

    return NextResponse.json({
      success: true,
      data: {
        compareId,
        images,
        models: modelResults,
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
