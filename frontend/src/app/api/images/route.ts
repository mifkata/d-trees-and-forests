import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface ImagesResponse {
  images: string[];
}

const OUTPUT_DIR = path.join(process.cwd(), "public", "output");

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ImagesResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ images: [] });
  }

  try {
    const runDir = path.join(OUTPUT_DIR, runId);

    if (!fs.existsSync(runDir)) {
      return NextResponse.json({ images: [] });
    }

    const files = fs.readdirSync(runDir);
    const images = files
      .filter((file) => file.endsWith(".png"))
      .map((file) => `/output/${runId}/${file}`);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
