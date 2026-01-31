import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "public", "output");
const NAME_PATTERN = /^[a-zA-Z0-9_-]*$/;
const MAX_LENGTH = 50;

interface RenameRequest {
  runId: string;
  name: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RenameRequest = await request.json();
    const { runId, name } = body;

    if (!runId || !/^\d{10}$/.test(runId)) {
      return NextResponse.json({ error: "Invalid run ID" }, { status: 400 });
    }

    if (!NAME_PATTERN.test(name)) {
      return NextResponse.json(
        { error: "Name must contain only alphanumeric characters, hyphens, and underscores" },
        { status: 400 }
      );
    }

    if (name.length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    const runDir = path.join(OUTPUT_DIR, runId);
    if (!fs.existsSync(runDir)) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const files = fs.readdirSync(runDir);
    const idFile = files.find((f) => f.endsWith(".id"));

    if (!idFile) {
      return NextResponse.json({ error: "ID file not found" }, { status: 404 });
    }

    // Parse current filename: <model>_<dataset>_<score>[_<name>].id
    const match = idFile.match(/^([^_]+)_([^_]+)_(\d{6})(?:_(.+))?\.id$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid ID file format" },
        { status: 500 }
      );
    }

    const [, model, dataset, score] = match;

    // Build new filename
    let newFilename: string;
    if (name) {
      newFilename = `${model}_${dataset}_${score}_${name}.id`;
    } else {
      // Empty name removes the custom name
      newFilename = `${model}_${dataset}_${score}.id`;
    }

    // Rename the file
    const oldPath = path.join(runDir, idFile);
    const newPath = path.join(runDir, newFilename);

    if (oldPath !== newPath) {
      fs.renameSync(oldPath, newPath);
    }

    return NextResponse.json({ success: true, name });
  } catch {
    return NextResponse.json(
      { error: "Failed to rename run" },
      { status: 500 }
    );
  }
}
