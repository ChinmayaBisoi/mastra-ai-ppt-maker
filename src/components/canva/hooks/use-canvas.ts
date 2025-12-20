import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Canvas, Textbox } from "fabric";
import type { UseCanvasReturn, CanvasConfig, TextboxConfig } from "../types";
import {
  getTextboxMetadata,
  setTextboxMetadata,
  isTextbox,
  clamp,
  calculateScale,
  scaleTextboxFontSizes,
} from "../utils";
import {
  CANVAS_CONFIG,
  DEFAULT_TEXTBOX_CONFIG,
  FONT_SIZE_LIMITS,
} from "../types";

interface UseCanvasOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasConfig?: Partial<CanvasConfig>;
}

export function useCanvas({
  containerRef,
  canvasRef,
  canvasConfig = {},
}: UseCanvasOptions): UseCanvasReturn {
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [scale, setScale] = useState(1);
  const [selectedTextbox, setSelectedTextbox] = useState<Textbox | null>(null);
  const [fontSize, setFontSize] = useState<number>(40);

  const config: CanvasConfig = useMemo(
    () => ({
      ...CANVAS_CONFIG,
      ...canvasConfig,
    }),
    [canvasConfig]
  );

  // Update canvas scale based on container size
  const updateCanvasScale = useCallback(() => {
    if (!containerRef.current || !fabricCanvasRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40; // Padding
    const containerHeight = container.clientHeight - 40;

    const oldScale = scale;
    const newScale = calculateScale(
      containerWidth,
      containerHeight,
      config.width,
      config.height
    );

    setScale(newScale);

    const scaledWidth = config.width * newScale;
    const scaledHeight = config.height * newScale;

    const canvas = fabricCanvasRef.current;
    canvas.setDimensions({
      width: scaledWidth,
      height: scaledHeight,
    });

    canvas.setZoom(newScale);

    // Scale text font sizes proportionally with canvas resize
    if (oldScale > 0) {
      const scaleFactor = newScale / oldScale;
      scaleTextboxFontSizes(canvas, scaleFactor);
    }

    canvas.renderAll();
  }, [scale, config.width, config.height]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
    });

    fabricCanvasRef.current = canvas;

    // Store original dimensions when scaling starts
    const handleScalingStart = (): void => {
      const activeObject = canvas.getActiveObject() ?? null;
      if (isTextbox(activeObject)) {
        setTextboxMetadata(activeObject, {
          originalFontSize: activeObject.fontSize,
          originalWidth: activeObject.width,
          originalHeight: activeObject.height,
        });
      }
    };

    // Handle object scaling - prevent font size from changing on resize
    const handleObjectScaling = (): void => {
      const activeObject = canvas.getActiveObject() ?? null;
      if (isTextbox(activeObject)) {
        const metadata = getTextboxMetadata(activeObject);
        if (metadata?.originalFontSize !== undefined) {
          activeObject.set({ fontSize: metadata.originalFontSize });
        }
        canvas.renderAll();
      }
    };

    // Handle object modified - ensure font size stays constant
    const handleObjectModified = (): void => {
      const activeObject = canvas.getActiveObject() ?? null;
      if (isTextbox(activeObject)) {
        const metadata = getTextboxMetadata(activeObject);
        if (metadata?.originalFontSize !== undefined) {
          activeObject.set({ fontSize: metadata.originalFontSize });
          // Update stored font size to current (in case user changed it via other means)
          setTextboxMetadata(activeObject, {
            originalFontSize: activeObject.fontSize,
          });
        }
        canvas.renderAll();
      }
    };

    // Track selection changes for font size control
    const handleSelection = (): void => {
      const activeObject = canvas.getActiveObject() ?? null;
      if (isTextbox(activeObject)) {
        setSelectedTextbox(activeObject);
        setFontSize(activeObject.fontSize ?? 40);
      } else {
        setSelectedTextbox(null);
      }
    };

    const handleDeselection = (): void => {
      setSelectedTextbox(null);
    };

    // Register event handlers
    canvas.on("object:scaling", handleObjectScaling);
    canvas.on("before:transform", handleScalingStart);
    canvas.on("object:modified", handleObjectModified);
    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleDeselection);

    // Calculate initial scale based on container
    const timeoutId = setTimeout(() => {
      updateCanvasScale();
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      canvas.off("object:scaling", handleObjectScaling);
      canvas.off("before:transform", handleScalingStart);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", handleDeselection);
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [updateCanvasScale, config]);

  // Handle window resize
  useEffect(() => {
    const handleResize = (): void => {
      updateCanvasScale();
    };

    window.addEventListener("resize", handleResize);
    const timeoutId = setTimeout(updateCanvasScale, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateCanvasScale]);

  // Add text element
  const addText = useCallback((): void => {
    if (!fabricCanvasRef.current) {
      console.error("Canvas not initialized. Please wait for canvas to load.");
      return;
    }

    const canvas = fabricCanvasRef.current;

    // Use base font size (not scaled) - scaling happens on canvas resize
    const baseFontSize = 40;
    const textboxConfig: TextboxConfig = {
      ...DEFAULT_TEXTBOX_CONFIG,
      left: config.width / 2,
      top: config.height / 2,
      fontSize: baseFontSize,
    };

    const textbox = new Textbox(textboxConfig.text, {
      left: textboxConfig.left,
      top: textboxConfig.top,
      width: textboxConfig.width,
      fontSize: textboxConfig.fontSize,
      fill: textboxConfig.fill,
      fontFamily: textboxConfig.fontFamily,
      hasControls: true,
      hasBorders: true,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      lockMovementX: false,
      lockMovementY: false,
      splitByGrapheme: true,
      textAlign: "left",
      originX: "center",
      originY: "center",
    });

    setTextboxMetadata(textbox, { originalFontSize: baseFontSize });

    textbox.on("changed", () => {
      setTextboxMetadata(textbox, {
        originalFontSize: textbox.fontSize ?? baseFontSize,
      });
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);

    // Delay entering editing mode to ensure textbox is fully rendered
    setTimeout(() => {
      if (textbox && canvas.getObjects().includes(textbox)) {
        textbox.enterEditing();
        canvas.renderAll();
      }
    }, 50);

    canvas.renderAll();
  }, [config.width, config.height]);

  // Export canvas to JSON
  const exportToJSON = useCallback((): void => {
    if (!fabricCanvasRef.current) return;

    const json = fabricCanvasRef.current.toJSON();
    const exportData = {
      version: "1.0",
      canvasWidth: config.width,
      canvasHeight: config.height,
      canvasData: json,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    // Use dynamic import for file-saver to avoid SSR issues
    import("file-saver").then(({ saveAs }) => {
      saveAs(blob, "canvas-export.json");
    });
  }, [config.width, config.height]);

  // Import canvas from JSON
  const importFromJSON = useCallback(
    async (file: File): Promise<void> => {
      if (!fabricCanvasRef.current) {
        throw new Error("Canvas not initialized");
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            if (!e.target?.result || typeof e.target.result !== "string") {
              throw new Error("Invalid file content");
            }

            const json = JSON.parse(e.target.result);
            const canvasData = json.canvasData || json;

            fabricCanvasRef.current?.loadFromJSON(canvasData, () => {
              fabricCanvasRef.current?.renderAll();
              updateCanvasScale();
              resolve();
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to load JSON file. Please check the file format.";
            reject(new Error(errorMessage));
          }
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsText(file);
      });
    },
    [updateCanvasScale]
  );

  // Update font size
  const updateFontSize = useCallback((newSize: number): void => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject() ?? null;
    if (!isTextbox(activeObject)) return;

    const size = clamp(newSize, FONT_SIZE_LIMITS.min, FONT_SIZE_LIMITS.max);
    activeObject.set({ fontSize: size });
    setTextboxMetadata(activeObject, { originalFontSize: size });
    fabricCanvasRef.current.renderAll();
    setFontSize(size);
  }, []);

  return {
    canvas: fabricCanvasRef.current,
    scale,
    selectedTextbox,
    fontSize,
    addText,
    exportToJSON,
    importFromJSON,
    updateFontSize,
    setSelectedTextbox,
    setFontSize,
  };
}
