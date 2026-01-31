import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "public", "output");

interface DeleteResponse {
  success: boolean;
  error?: string;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
): Promise<NextResponse<DeleteResponse>> {
  const { runId } = await params;

  // Validate runId is a 10-digit timestamp
  if (!/^\d{10}$/.test(runId)) {
    return NextResponse.json(
      { success: false, error: "Invalid run ID format" },
      { status: 400 }
    );
  }

  const runDir = path.join(OUTPUT_DIR, runId);

  try {
    // Check if directory exists
    if (!fs.existsSync(runDir)) {
      return NextResponse.json(
        { success: false, error: "Run not found" },
        { status: 404 }
      );
    }

    // Remove the entire run directory
    fs.rmSync(runDir, { recursive: true, force: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete run:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete run" },
      { status: 500 }
    );
  }
}
