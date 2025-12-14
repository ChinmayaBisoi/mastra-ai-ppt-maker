import { NextRequest, NextResponse } from "next/server";
import PPTX2Json from "pptx2json";

import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".pptx")) {
      return NextResponse.json(
        { error: "File must be a .pptx file" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temporary file path
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, file.name);
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // Convert PPTX to JSON using pptx2json
      const pptx2json = new PPTX2Json();
      const json = await pptx2json.toJson(tempFilePath);

      // Save JSON to output folder
      const outputDir = path.join(process.cwd(), "output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const jsonFileName = `${path.parse(file.name).name}.json`;
      const jsonFilePath = path.join(outputDir, jsonFileName);
      fs.writeFileSync(jsonFilePath, JSON.stringify(json, null, 2));

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      return NextResponse.json({
        success: true,
        json,
        savedFilePath: jsonFilePath,
        message: `Successfully converted PPTX to JSON. Saved to: ${jsonFilePath}`,
      });
    } catch (conversionError) {
      // Clean up temporary file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw conversionError;
    }
  } catch (error) {
    console.error("Error processing PPTX file:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to convert PPTX to JSON",
      },
      { status: 500 }
    );
  }
}
