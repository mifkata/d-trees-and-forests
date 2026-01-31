import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "public", "output");
const COMPARE_DIR = path.join(OUTPUT_DIR, "compare");
const NAME_PATTERN = /^[a-zA-Z0-9_.\s-]*$/;
const MAX_LENGTH = 50;

interface RenameRequest {
  compareId: string;
  name: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RenameRequest = await request.json();
    const { compareId, name } = body;

    if (!compareId || !/^\d{10}$/.test(compareId)) {
      return NextResponse.json(
        { error: "Invalid compare ID" },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (name !== null && name !== "") {
      if (!NAME_PATTERN.test(name)) {
        return NextResponse.json(
          {
            error:
              "Name must contain only alphanumeric characters, hyphens, underscores, dots, and spaces",
          },
          { status: 400 }
        );
      }

      if (name.length > MAX_LENGTH) {
        return NextResponse.json(
          { error: `Name must be ${MAX_LENGTH} characters or less` },
          { status: 400 }
        );
      }
    }

    const compareDir = path.join(COMPARE_DIR, compareId);
    if (!fs.existsSync(compareDir)) {
      return NextResponse.json(
        { error: "Compare run not found" },
        { status: 404 }
      );
    }

    const runtimePath = path.join(compareDir, "runtime.json");
    if (!fs.existsSync(runtimePath)) {
      return NextResponse.json(
        { error: "runtime.json not found" },
        { status: 404 }
      );
    }

    // Read current runtime.json
    const runtimeContent = fs.readFileSync(runtimePath, "utf-8");
    const runtime = JSON.parse(runtimeContent);

    // Update name (convert spaces to underscores, empty string or null clears the name)
    const sanitizedName =
      name === null || name === "" ? null : name.trim().replace(/ /g, "_");
    runtime.name = sanitizedName;

    // Write updated runtime.json
    fs.writeFileSync(runtimePath, JSON.stringify(runtime, null, 2));

    return NextResponse.json({ success: true, name: sanitizedName });
  } catch {
    return NextResponse.json(
      { error: "Failed to rename compare run" },
      { status: 500 }
    );
  }
}
