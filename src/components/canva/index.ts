export { default as CanvaEditor } from "./canva-editor";
export { useCanvas } from "./hooks/use-canvas";
export type {
  CanvasDimensions,
  CanvasExportData,
  TextboxMetadata,
  ExtendedTextbox,
  UseCanvasReturn,
  CanvasConfig,
  TextboxConfig,
} from "./types";
export {
  CANVAS_CONFIG,
  DEFAULT_TEXTBOX_CONFIG,
  FONT_SIZE_LIMITS,
} from "./types";
export {
  getTextboxMetadata,
  setTextboxMetadata,
  isTextbox,
  clamp,
  calculateScale,
  scaleTextboxFontSizes,
} from "./utils";

