import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import type {
  TrainRequest,
  TrainResponse,
  TrainResult,
  ErrorCode,
  ModelInfo,
} from "@/types/api";
import { MODELS } from "@/types/model";

const SCRIPTS_DIR =
  process.env.SCRIPTS_DIR || path.resolve(process.cwd(), "..");
const SCRIPT_TIMEOUT = 300000; // 5 minutes

class ScriptError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: string,
    public stackTrace?: string,
  ) {
    super(message);
    this.name = "ScriptError";
  }
}

interface ScriptResult {
  stdout: string;
  stderr: string;
  code: number;
}

function buildArgs(request: TrainRequest): string[] {
  const { dataset, datasetParams, modelParams } = request;

  const args: string[] = [
    "--json",
    "--dataset",
    dataset,
    "--mask",
    String(datasetParams.mask),
  ];

  if (datasetParams.impute) {
    args.push("--impute");
  }

  if (datasetParams.use_output) {
    args.push("--use-output", "true");
  }

  if (datasetParams.images) {
    args.push("--images");
  }

  // Add model config as JSON (already in snake_case)
  if (modelParams) {
    args.push("--model-config", JSON.stringify(modelParams));
  }

  return args;
}

async function executeScript(
  script: string,
  args: string[],
): Promise<ScriptResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, script);

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
          new ScriptError(
            `Script exited with code ${code}`,
            "SCRIPT_EXECUTION_ERROR",
            stderr || stdout,
            extractStackTrace(stderr),
          ),
        );
      }
    });

    child.on("error", (err) => {
      reject(
        new ScriptError(
          `Failed to execute script: ${err.message}`,
          "SCRIPT_NOT_FOUND",
          err.message,
        ),
      );
    });
  });
}

function extractStackTrace(stderr: string): string | undefined {
  const lines = stderr.split("\n");
  const traceStart = lines.findIndex((line) => line.includes("Traceback"));
  if (traceStart === -1) return undefined;
  return lines.slice(traceStart).join("\n");
}

interface PythonClassificationReport {
  accuracy: number;
  [key: string]:
    | {
        precision: number;
        recall: number;
        "f1-score": number;
        support: number;
      }
    | number;
}

interface PythonOutput {
  accuracy: number;
  classification_report: PythonClassificationReport;
  model_info?: {
    type?: string;
    nIterations?: number;
    n_iter_?: number;
    treeDepth?: number;
    nLeaves?: number;
    nEstimators?: number;
    oobScore?: number;
  };
}

function parseJsonOutput(stdout: string): TrainResult | null {
  try {
    // Extract JSON from stdout (may contain warnings/other output before JSON)
    const jsonStart = stdout.indexOf("{");
    const jsonEnd = stdout.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return null;
    }
    const jsonString = stdout.slice(jsonStart, jsonEnd + 1);
    const jsonOutput: PythonOutput = JSON.parse(jsonString);

    const report = jsonOutput.classification_report;
    const classes = Object.entries(report)
      .filter(
        ([key]) => !["accuracy", "macro avg", "weighted avg"].includes(key),
      )
      .map(([label, metrics]) => {
        if (typeof metrics === "number") return null;
        return {
          label,
          precision: metrics.precision,
          recall: metrics.recall,
          f1Score: metrics["f1-score"],
          support: metrics.support,
        };
      })
      .filter(Boolean) as TrainResult["classificationReport"]["classes"];

    const macroAvg = report["macro avg"];
    const weightedAvg = report["weighted avg"];

    if (typeof macroAvg === "number" || typeof weightedAvg === "number") {
      return null;
    }

    const result: TrainResult = {
      accuracy: jsonOutput.accuracy,
      accuracyPercent: `${(jsonOutput.accuracy * 100).toFixed(2)}%`,
      classificationReport: {
        classes,
        accuracy:
          typeof report.accuracy === "number"
            ? report.accuracy
            : jsonOutput.accuracy,
        macroAvg: {
          precision: macroAvg.precision,
          recall: macroAvg.recall,
          f1Score: macroAvg["f1-score"],
          support: macroAvg.support,
        },
        weightedAvg: {
          precision: weightedAvg.precision,
          recall: weightedAvg.recall,
          f1Score: weightedAvg["f1-score"],
          support: weightedAvg.support,
        },
      },
      executionTime: 0,
    };

    if (jsonOutput.model_info) {
      result.modelInfo = {
        type: jsonOutput.model_info.type as ModelInfo["type"],
        nIterations:
          jsonOutput.model_info.nIterations || jsonOutput.model_info.n_iter_,
        treeDepth: jsonOutput.model_info.treeDepth,
        nLeaves: jsonOutput.model_info.nLeaves,
        nEstimators: jsonOutput.model_info.nEstimators,
        oobScore: jsonOutput.model_info.oobScore,
      };
    }

    return result;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<TrainResponse>> {
  const startTime = Date.now();

  try {
    const body: TrainRequest = await request.json();

    const { model } = body;
    const modelConfig = MODELS[model];

    if (!modelConfig) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Unknown model: ${model}`,
            code: "INVALID_PARAMS" as ErrorCode,
          },
        },
        { status: 400 },
      );
    }

    const script = modelConfig.script;
    const args = buildArgs(body);

    const result = await executeScript(script, args);

    const jsonOutput = parseJsonOutput(result.stdout);
    if (!jsonOutput) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Script did not return valid JSON",
            code: "INVALID_JSON_OUTPUT" as ErrorCode,
            details: result.stdout,
            stackTrace: result.stderr || undefined,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...jsonOutput,
        executionTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    if (error instanceof ScriptError) {
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
          code: "UNKNOWN_ERROR" as ErrorCode,
          details: String(error),
        },
      },
      { status: 500 },
    );
  }
}
