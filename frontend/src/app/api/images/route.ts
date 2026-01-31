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
  const compareId = searchParams.get("compareId");

  // Determine the directory and URL prefix based on parameter
  let targetDir: string;
  let urlPrefix: string;

  if (compareId) {
    targetDir = path.join(OUTPUT_DIR, "compare", compareId);
    urlPrefix = `/output/compare/${compareId}`;
  } else if (runId) {
    targetDir = path.join(OUTPUT_DIR, runId);
    urlPrefix = `/output/${runId}`;
  } else {
    return NextResponse.json({ images: [] });
  }

  try {
    if (!fs.existsSync(targetDir)) {
      return NextResponse.json({ images: [] });
    }

    const files = fs.readdirSync(targetDir);
    const images = files
      .filter((file) => file.endsWith(".png"))
      .map((file) => `${urlPrefix}/${file}`);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
