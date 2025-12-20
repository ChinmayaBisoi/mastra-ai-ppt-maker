import React, { forwardRef, useEffect } from "react";
import { CANVAS_CONFIG } from "../types";

interface CanvasContainerProps {
  scale: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCanvasReady?: (element: HTMLCanvasElement) => void;
  children?: React.ReactNode;
}

export const CanvasContainer = forwardRef<HTMLDivElement, CanvasContainerProps>(
  ({ scale, canvasRef, onCanvasReady }, containerRef) => {
    useEffect(() => {
      if (canvasRef.current && onCanvasReady) {
        onCanvasReady(canvasRef.current);
      }
    }, [canvasRef, onCanvasReady]);

    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted p-5 flex items-center justify-center"
      >
        <div
          style={{
            width: `${CANVAS_CONFIG.width * scale}px`,
            height: `${CANVAS_CONFIG.height * scale}px`,
            position: "relative",
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
    );
  }
);

CanvasContainer.displayName = "CanvasContainer";

