"use client";

import { useState, useRef, useEffect } from "react";
import type { SlideElement, Position } from "@/types/slide";
import { cn } from "@/lib/utils";

interface DraggableSlideElementProps {
  element: SlideElement;
  scale: number;
  onPositionChange: (elementId: string, newPosition: Position) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: (elementId: string, e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

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

function convertPixelsToInches(px: number, scale: number = INCH_TO_PX): number {
  return px / scale;
}

export function DraggableSlideElement({
  element,
  scale,
  onPositionChange,
  isDragging = false,
  isSelected = false,
  isHovered = false,
  onDragStart,
  onDragEnd,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: DraggableSlideElementProps) {
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const { x, y, width, height, isWidthPercentage, isHeightPercentage } = convertPosition(element.position, scale);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setDragOffset({ x: offsetX, y: offsetY });
      setIsDraggingLocal(true);
      onDragStart?.();
      e.preventDefault();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if we didn't drag
    if (!isDraggingLocal && onClick) {
      onClick(element.id, e);
    }
  };

  useEffect(() => {
    if (!isDraggingLocal) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!elementRef.current) return;

      const slideContainer = elementRef.current.closest('[data-slide-container]');
      if (!slideContainer) return;

      const containerRect = slideContainer.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;

      // Convert pixels back to inches
      const newXInches = Math.max(0, convertPixelsToInches(newX, scale));
      const newYInches = Math.max(0, convertPixelsToInches(newY, scale));

      // Update position
      const newPosition: Position = {
        ...element.position,
        x: newXInches,
        y: newYInches,
      };

      onPositionChange(element.id, newPosition);
    };

    const handleMouseUp = () => {
      setIsDraggingLocal(false);
      onDragEnd?.();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLocal, dragOffset, element.id, element.position, onPositionChange, onDragEnd, scale]);

  const isCurrentlyDragging = isDragging || isDraggingLocal;
  const showRing = isSelected || isHovered || isCurrentlyDragging;

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
      cursor: "move",
      userSelect: "none",
      zIndex: isCurrentlyDragging ? 1000 : 1,
      opacity: isCurrentlyDragging ? 0.8 : 1,
    };

    return (
      <div
        ref={elementRef}
        id={element.id}
        className={cn(
          "absolute",
          showRing && (isSelected ? "ring-2 ring-blue-600" : isHovered ? "ring-2 ring-blue-400" : "ring-2 ring-blue-500")
        )}
        style={style}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
      cursor: "move",
      userSelect: "none",
      zIndex: isCurrentlyDragging ? 1000 : 1,
      opacity: isCurrentlyDragging ? 0.8 : 1,
    };

    return (
      <div
        ref={elementRef}
        id={element.id}
        className={cn(
          "absolute",
          isCurrentlyDragging && "ring-2 ring-blue-500"
        )}
        style={style}
        onMouseDown={handleMouseDown}
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
      cursor: "move",
      userSelect: "none",
      zIndex: isCurrentlyDragging ? 1000 : 1,
      opacity: isCurrentlyDragging ? 0.8 : 1,
    };

    return (
      <div
        ref={elementRef}
        id={element.id}
        className={cn(
          "absolute",
          showRing && (isSelected ? "ring-2 ring-blue-600" : isHovered ? "ring-2 ring-blue-400" : "ring-2 ring-blue-500")
        )}
        style={style}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  return null;
}

