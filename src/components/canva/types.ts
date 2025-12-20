import type { Canvas, Textbox } from "fabric";

export interface CanvasDimensions {
  width: number;
  height: number;
}

export interface CanvasExportData {
  version: string;
  canvasWidth: number;
  canvasHeight: number;
  canvasData: string;
}

export interface TextboxMetadata {
  originalFontSize: number;
  originalWidth?: number;
  originalHeight?: number;
}

export interface ExtendedTextbox extends Textbox {
  _originalFontSize?: number;
  _originalWidth?: number;
  _originalHeight?: number;
}

export interface UseCanvasReturn {
  canvas: Canvas | null;
  scale: number;
  selectedTextbox: Textbox | null;
  fontSize: number;
  addText: () => void;
  exportToJSON: () => void;
  importFromJSON: (file: File) => Promise<void>;
  updateFontSize: (size: number) => void;
  setSelectedTextbox: (textbox: Textbox | null) => void;
  setFontSize: (size: number) => void;
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
}

export interface TextboxConfig {
  text: string;
  left: number;
  top: number;
  width: number;
  fontSize: number;
  fill: string;
  fontFamily: string;
}

export const CANVAS_CONFIG: CanvasConfig = {
  width: 1440,
  height: 840,
  backgroundColor: "#ffffff",
} as const;

export const DEFAULT_TEXTBOX_CONFIG: Omit<
  TextboxConfig,
  "left" | "top" | "fontSize"
> = {
  text: "Double click to edit",
  width: 300,
  fill: "#000000",
  fontFamily: "Arial",
} as const;

export const FONT_SIZE_LIMITS = {
  min: 8,
  max: 200,
} as const;
