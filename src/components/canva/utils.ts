import type { Textbox, Canvas, FabricObject } from "fabric";
import type { ExtendedTextbox, TextboxMetadata } from "./types";

/**
 * Safely get metadata from a textbox object
 */
export function getTextboxMetadata(textbox: Textbox): TextboxMetadata | null {
  const extended = textbox as ExtendedTextbox;
  if (extended._originalFontSize === undefined) {
    return null;
  }
  return {
    originalFontSize: extended._originalFontSize,
    originalWidth: extended._originalWidth,
    originalHeight: extended._originalHeight,
  };
}

/**
 * Set metadata on a textbox object
 */
export function setTextboxMetadata(
  textbox: Textbox,
  metadata: Partial<TextboxMetadata>
): void {
  const extended = textbox as ExtendedTextbox;
  if (metadata.originalFontSize !== undefined) {
    extended._originalFontSize = metadata.originalFontSize;
  }
  if (metadata.originalWidth !== undefined) {
    extended._originalWidth = metadata.originalWidth;
  }
  if (metadata.originalHeight !== undefined) {
    extended._originalHeight = metadata.originalHeight;
  }
}

/**
 * Check if an object is a textbox
 */
export function isTextbox(obj: FabricObject | null): obj is Textbox {
  return obj !== null && obj.type === "textbox";
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate scale factor to fit container while maintaining aspect ratio
 */
export function calculateScale(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  maxScale: number = 1
): number {
  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;
  return Math.min(scaleX, scaleY, maxScale);
}

/**
 * Scale all textbox font sizes proportionally
 */
export function scaleTextboxFontSizes(
  canvas: Canvas,
  scaleFactor: number
): void {
  const objects = canvas.getObjects();
  objects.forEach((obj) => {
    if (isTextbox(obj)) {
      const currentFontSize = obj.fontSize ?? 40;
      const newFontSize = currentFontSize * scaleFactor;
      obj.set({ fontSize: newFontSize });
      setTextboxMetadata(obj, { originalFontSize: newFontSize });
    }
  });
}

