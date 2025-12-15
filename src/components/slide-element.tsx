"use client";

import type { SlideElement, Position } from "@/types/slide";

interface SlideElementProps {
  element: SlideElement;
  scale: number; // Conversion factor from inches to pixels (assuming 96 DPI)
}

// Convert position to CSS pixels
// Assuming positions are in inches, convert to pixels at 96 DPI
const INCH_TO_PX = 96;

function convertPosition(position: Position, scale: number = INCH_TO_PX) {
  const x = position.x * scale;
  const y = position.y * scale;
  
  const isWidthPercentage = typeof position.width === "string" && position.width.endsWith("%");
  const width = isWidthPercentage 
    ? position.width 
    : (typeof position.width === "number" ? position.width : parseFloat(position.width)) * scale;
  
  const isHeightPercentage = position.height && typeof position.height === "string" && position.height.endsWith("%");
  const height = position.height 
    ? (isHeightPercentage ? position.height : (typeof position.height === "number" ? position.height : parseFloat(position.height)) * scale)
    : undefined;
  
  return { x, y, width, height, isWidthPercentage, isHeightPercentage };
}

export function SlideElementRenderer({ element, scale }: SlideElementProps) {
  const { x, y, width, height, isWidthPercentage, isHeightPercentage } = convertPosition(element.position, scale);

  if (element.type === "text") {
    const content = Array.isArray(element.content)
      ? element.content.join("\n")
      : element.content;

    const style: React.CSSProperties = {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: isWidthPercentage ? width as string : `${width}px`,
      height: height ? (isHeightPercentage ? height as string : `${height}px`) : "auto",
      fontSize: `${element.style.fontSize || 16}px`,
      fontWeight: element.style.fontWeight || "normal",
      fontFamily: element.style.fontFamily || "sans-serif",
      color: element.style.color || "#000000",
      textAlign: element.style.align || "left",
      letterSpacing: element.style.letterSpacing ? `${element.style.letterSpacing}px` : undefined,
      lineHeight: element.style.lineHeight ? `${element.style.lineHeight}px` : undefined,
      whiteSpace: "pre-wrap",
    };

    return (
      <div
        id={element.id}
        className="absolute"
        style={style}
      >
        {content}
      </div>
    );
  }

  if (element.type === "line") {
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: isWidthPercentage ? width as string : `${width}px`,
      height: `${element.style.strokeWidth || 1}px`,
      backgroundColor: element.style.strokeColor || "#000000",
      transform: "translateY(-50%)",
    };

    return (
      <div
        id={element.id}
        className="absolute"
        style={style}
      />
    );
  }

  if (element.type === "shape") {
    const borderRadius = element.shape === "circle" || element.shape === "ellipse" ? "50%" : 0;

    const style: React.CSSProperties = {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: isWidthPercentage ? width as string : `${width}px`,
      height: height 
        ? (isHeightPercentage ? height as string : `${height}px`)
        : (isWidthPercentage ? "auto" : `${width}px`),
      borderColor: element.style.strokeColor || "transparent",
      borderWidth: `${element.style.strokeWidth || 0}px`,
      borderStyle: "solid",
      backgroundColor: element.style.fillColor || "transparent",
      borderRadius: borderRadius,
    };

    return (
      <div
        id={element.id}
        className="absolute"
        style={style}
      />
    );
  }

  return null;
}

