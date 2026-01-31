import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "public", "output");
const COMPARE_DIR = path.join(OUTPUT_DIR, "compare");

interface DeleteResponse {
  success: boolean;
  error?: string;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ compareId: string }> }
): Promise<NextResponse<DeleteResponse>> {
  const { compareId } = await params;

  // Validate compareId is a 10-digit timestamp
  if (!/^\d{10}$/.test(compareId)) {
    return NextResponse.json(
      { success: false, error: "Invalid compare ID format" },
      { status: 400 }
    );
  }

  const compareDir = path.join(COMPARE_DIR, compareId);

  try {
    // Check if directory exists
    if (!fs.existsSync(compareDir)) {
      return NextResponse.json(
        { success: false, error: "Compare run not found" },
        { status: 404 }
      );
    }

    // Remove the entire compare directory
    fs.rmSync(compareDir, { recursive: true, force: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete compare run:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete compare run" },
      { status: 500 }
    );
  }
}
