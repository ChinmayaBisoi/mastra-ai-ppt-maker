#!/usr/bin/env tsx
/**
 * Script to extract PPTX data using extractPptx and save to JSON
 *
 * Usage:
 *   npx tsx src/scripts/save-extracted-pptx.ts <path-to-pptx-file> [output-path]
 *
 * Example:
 *   npx tsx src/scripts/save-extracted-pptx.ts test-pptx-files/cream-neutral-minimalist.pptx
 */

// @ts-ignore - jszip-xml2js-parser may not exist
import { extractPptx } from "../utils/jszip-xml2js-parser";
import fs from "fs";
import path from "path";

async function main() {
  const filePath = process.argv[2];
  const outputPath = process.argv[3];

  if (!filePath) {
    console.error(
      "Usage: npx tsx src/scripts/save-extracted-pptx.ts <path-to-pptx-file> [output-path]"
    );
    process.exit(1);
  }

  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`Extracting PPTX: ${fullPath}\n`);

  try {
    // Extract using extractPptx function
    const extracted = await extractPptx(fullPath);

    console.log("✅ Extraction complete!\n");
    console.log(`Slides: ${extracted.slides.length}`);
    console.log(`Media: ${extracted.media.length}`);
    console.log(`Notes: ${extracted.notes.length}\n`);

    // Determine output path
    let finalOutputPath: string;
    if (outputPath) {
      finalOutputPath = path.isAbsolute(outputPath)
        ? outputPath
        : path.join(process.cwd(), outputPath);
    } else {
      // Default: save to output directory with same name as input file
      const outputDir = path.join(process.cwd(), "output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const inputFileName = path.parse(filePath).name;
      finalOutputPath = path.join(outputDir, `${inputFileName}-extracted.json`);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save to JSON file
    fs.writeFileSync(
      finalOutputPath,
      JSON.stringify(extracted, null, 2),
      "utf-8"
    );

    const fileSize = fs.statSync(finalOutputPath).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    console.log(`✅ Saved to: ${finalOutputPath}`);
    console.log(`   File size: ${fileSizeKB} KB (${fileSizeMB} MB)\n`);

    // Print summary
    console.log("=== Summary ===");
    extracted.slides.forEach((slide: any, i: number) => {
      console.log(`\nSlide ${i + 1}: ${slide.name}`);
      console.log(`  Elements: ${slide.content.length}`);
      console.log(`  Media references: ${slide.mediaNames.length}`);
      if (slide.content.length > 0) {
        slide.content.forEach((el: any, elIdx: number) => {
          const textPreview = el.text.join(" ").substring(0, 60);
          const ellipsis = textPreview.length >= 60 ? "..." : "";
          console.log(
            `    ${elIdx + 1}. [${el.type}] ${textPreview}${ellipsis}`
          );
        });
      }
    });

    if (extracted.media.length > 0) {
      console.log("\n=== Media Files (" + extracted.media.length + ") ===");
      extracted.media.forEach((media: any, i: number) => {
        const sizeKB = Math.round(media.content.length / 1024);
        console.log(
          "  " + (i + 1) + ". " + media.name + " (~" + sizeKB + " KB)"
        );
      });
    }

    if (extracted.notes.length > 0) {
      console.log("\n=== Notes (" + extracted.notes.length + ") ===");
      extracted.notes.forEach((note: any, i: number) => {
        console.log(
          "  " +
            (i + 1) +
            ". " +
            note.name +
            " (" +
            note.content.length +
            " chars)"
        );
      });
    }
  } catch (error) {
    console.error("Error extracting PPTX:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
