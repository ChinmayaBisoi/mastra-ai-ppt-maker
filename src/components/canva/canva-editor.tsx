"use client";

import React, { useRef } from "react";
import { useCanvas } from "./hooks/use-canvas";
import { Toolbar } from "./components/toolbar";
import { CanvasContainer } from "./components/canvas-container";

function CanvaEditor(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    scale,
    selectedTextbox,
    fontSize,
    addText,
    exportToJSON,
    importFromJSON,
    updateFontSize,
  } = useCanvas({
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    canvasRef,
  });

  return (
    <div className="flex flex-col h-full w-full">
      <Toolbar
        onAddText={addText}
        onExportJSON={exportToJSON}
        onImportJSON={importFromJSON}
        selectedTextbox={selectedTextbox}
        fontSize={fontSize}
        onFontSizeChange={updateFontSize}
      />

      <CanvasContainer ref={containerRef} scale={scale} canvasRef={canvasRef} />
    </div>
  );
}

export default CanvaEditor;
