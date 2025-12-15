"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { parse as parseViaPptxtojson } from "pptxtojson";
import data from "@/data/pptx2json/cream-neutral-minimalist.json";
import { cn } from "@/lib/utils";

type JsonData = Awaited<ReturnType<typeof parseViaPptxtojson>>;

interface SlideViewerProps {
  className?: string;
}

export function SlideViewer({ className }: SlideViewerProps) {
  const [jsonData] = useState<JsonData>(data as JsonData);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());
  const [highlightedElement, setHighlightedElement] = useState<string | null>(
    null
  );
  const currentSlide = jsonData.slides[currentSlideIndex];
  const totalSlides = jsonData.slides.length;

  // Use exact slide dimensions from data - no calculations, no scaling
  const slideWidth = jsonData.size?.width || 0;
  const slideHeight = jsonData.size?.height || 0;

  const goToPrevious = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  const toggleElementVisibility = (elementId: string) => {
    setHiddenElements((prev) => {
      const next = new Set(prev);
      if (next.has(elementId)) {
        next.delete(elementId);
      } else {
        next.add(elementId);
      }
      return next;
    });
  };

  const getFillStyle = (fill: JsonData["slides"][0]["fill"]) => {
    if (fill.type === "color") {
      return { backgroundColor: fill.value || "transparent" };
    } else if (fill.type === "image" && fill.value.picBase64) {
      return {
        backgroundImage: `url(${fill.value.picBase64})`,
        backgroundSize: "cover",
      };
    }
    return {};
  };

  // Process HTML content to convert pt to px for accurate sizing
  const processContent = (content: string): string => {
    if (!content) return content;
    // Convert pt to px: PowerPoint 72 DPI = 1pt = 1px, Browser 96 DPI = 1pt = 1.333px
    // To match PowerPoint, we need: px = pt * (72/96) = pt * 0.75
    return content.replace(/(\d+\.?\d*)pt/g, (match, value) => {
      const pt = parseFloat(value);
      const px = pt * 0.75; // Convert to match PowerPoint sizing
      return `${px}px`;
    });
  };

  const renderElement = (
    element: JsonData["slides"][0]["elements"][0],
    index: number
  ) => {
    const elementId = `${currentSlideIndex}-${index}`;
    const isHidden = hiddenElements.has(elementId);
    const isHighlighted = highlightedElement === elementId;

    if (isHidden) return null;

    if (slideWidth === 0 || slideHeight === 0) return null;

    // Common props for all elements
    const commonProps = {
      "data-element-id": elementId,
      "data-element-index": index,
      "data-element-type": element.type,
      "data-element-order": element.order || 0,
    };

    if (element.type === "shape") {
      const shape = element;
      const style: React.CSSProperties = {
        position: "absolute",
        left: `${shape.left || 0}px`,
        top: `${shape.top || 0}px`,
        width: `${shape.width || 0}px`,
        height: `${shape.height || 0}px`,
        transform: `rotate(${shape.rotate || 0}deg) ${shape.isFlipH ? "scaleX(-1)" : ""} ${shape.isFlipV ? "scaleY(-1)" : ""}`,
        transformOrigin: "center",
        borderColor: shape.borderColor || "transparent",
        borderWidth: shape.borderWidth || 0,
        borderStyle: shape.borderType || "solid",
        outline: isHighlighted ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
        transition: "outline 0.2s",
        overflow: "hidden",
      };

      // Handle fill
      if (shape.fill) {
        if (shape.fill.type === "color") {
          style.backgroundColor = shape.fill.value || "transparent";
        } else if (shape.fill.type === "image" && shape.fill.value.picBase64) {
          style.backgroundImage = `url(${shape.fill.value.picBase64})`;
          style.backgroundSize = "cover";
          style.backgroundPosition = "center";
        }
      }

      if (shape.shapType === "line" && shape.path) {
        return (
          <svg
            key={elementId}
            {...commonProps}
            data-element-name={shape.name || ""}
            style={style}
            className="pointer-events-none"
            viewBox={`0 0 ${shape.width} ${shape.height}`}
            preserveAspectRatio="none"
          >
            <path
              d={shape.path}
              stroke={shape.borderColor || "#000"}
              strokeWidth={shape.borderWidth || 1}
              fill="none"
            />
          </svg>
        );
      } else if (shape.shapType === "custom" && shape.path) {
        return (
          <svg
            key={elementId}
            {...commonProps}
            data-element-name={shape.name || ""}
            style={style}
            className="pointer-events-none"
            viewBox={`0 0 ${shape.width} ${shape.height}`}
            preserveAspectRatio="none"
          >
            <path
              d={shape.path}
              fill={
                shape.fill?.type === "color"
                  ? shape.fill.value || "transparent"
                  : "transparent"
              }
              stroke={shape.borderColor || "transparent"}
              strokeWidth={shape.borderWidth || 0}
            />
            {shape.fill?.type === "image" && shape.fill.value.picBase64 && (
              <defs>
                <pattern
                  id={`pattern-${elementId}`}
                  x="0"
                  y="0"
                  width="1"
                  height="1"
                >
                  <image
                    href={shape.fill.value.picBase64}
                    width={shape.width}
                    height={shape.height}
                  />
                </pattern>
              </defs>
            )}
            {shape.fill?.type === "image" && (
              <path d={shape.path} fill={`url(#pattern-${elementId})`} />
            )}
          </svg>
        );
      } else {
        // Rectangle or other shape with text content
        return (
          <div
            key={elementId}
            {...commonProps}
            data-element-name={shape.name || ""}
            style={{
              ...style,
              display: "flex",
              alignItems:
                shape.vAlign === "middle"
                  ? "center"
                  : shape.vAlign === "bottom"
                    ? "flex-end"
                    : "flex-start",
              boxSizing: "border-box",
            }}
            className="pointer-events-none"
            dangerouslySetInnerHTML={
              shape.content
                ? { __html: processContent(shape.content) }
                : undefined
            }
          />
        );
      }
    } else if (element.type === "text") {
      const text = element;
      const style: React.CSSProperties = {
        position: "absolute",
        left: `${text.left || 0}px`,
        top: `${text.top || 0}px`,
        width: `${text.width || 0}px`,
        height: `${text.height || 0}px`,
        transform: `rotate(${text.rotate || 0}deg) ${text.isFlipH ? "scaleX(-1)" : ""} ${text.isFlipV ? "scaleY(-1)" : ""}`,
        transformOrigin: "center",
        borderColor: text.borderColor || "transparent",
        borderWidth: text.borderWidth || 0,
        borderStyle: text.borderType || "solid",
        outline: isHighlighted ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
        transition: "outline 0.2s",
        overflow: "hidden",
      };

      // Handle fill
      if (text.fill) {
        if (text.fill.type === "color") {
          style.backgroundColor = text.fill.value || "transparent";
        } else if (text.fill.type === "image" && text.fill.value.picBase64) {
          style.backgroundImage = `url(${text.fill.value.picBase64})`;
          style.backgroundSize = "cover";
          style.backgroundPosition = "center";
        }
      }

      return (
        <div
          key={elementId}
          {...commonProps}
          data-element-name={text.name || ""}
          style={{
            ...style,
            display: "flex",
            alignItems:
              text.vAlign === "middle"
                ? "center"
                : text.vAlign === "bottom"
                  ? "flex-end"
                  : "flex-start",
            boxSizing: "border-box",
          }}
          className="pointer-events-none"
          dangerouslySetInnerHTML={
            text.content ? { __html: processContent(text.content) } : undefined
          }
        />
      );
    } else if (element.type === "image") {
      const image = element;
      const style: React.CSSProperties = {
        position: "absolute",
        left: `${image.left || 0}px`,
        top: `${image.top || 0}px`,
        width: `${image.width || 0}px`,
        height: `${image.height || 0}px`,
        transform: `rotate(${image.rotate || 0}deg) ${image.isFlipH ? "scaleX(-1)" : ""} ${image.isFlipV ? "scaleY(-1)" : ""}`,
        transformOrigin: "center",
        outline: isHighlighted ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
        transition: "outline 0.2s",
        overflow: "hidden",
      };

      return (
        <img
          key={elementId}
          {...commonProps}
          data-element-name=""
          src={image.src}
          alt=""
          style={style}
          className="pointer-events-none object-contain"
        />
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen w-full bg-gray-100 dark:bg-gray-900",
        className
      )}
    >
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {currentSlideIndex + 1} / {totalSlides}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={currentSlideIndex === totalSlides - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Layers className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[400px] sm:w-[540px] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Elements</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {currentSlide.elements.map((element, index) => {
                const elementId = `${currentSlideIndex}-${index}`;
                const isHidden = hiddenElements.has(elementId);
                const isHighlighted = highlightedElement === elementId;
                const elementName =
                  element.type === "shape"
                    ? element.name || ""
                    : element.type === "text"
                      ? element.name || ""
                      : element.type === "image"
                        ? ""
                        : "";

                return (
                  <div
                    key={elementId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      isHighlighted &&
                        "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700",
                      !isHighlighted &&
                        "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    onMouseEnter={() => setHighlightedElement(elementId)}
                    onMouseLeave={() => setHighlightedElement(null)}
                    onClick={() => setHighlightedElement(elementId)}
                  >
                    <Checkbox
                      checked={!isHidden}
                      onCheckedChange={() => toggleElementVisibility(elementId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {elementName || `${element.type} ${index + 1}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {element.type} • Order: {element.order}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Slide container */}
      {/* <div
        id="slide-container"
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
      > */}
      {slideWidth > 0 && slideHeight > 0 && (
        <div
          className="relative bg-white shadow-2xl"
          style={{
            width: `${slideWidth}px`,
            height: `${slideHeight}px`,
            overflow: "hidden",
            ...getFillStyle(currentSlide.fill),
          }}
        >
          {currentSlide.elements
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((element, index) => renderElement(element, index))}
        </div>
      )}
      {/* </div> */}
    </div>
  );
}
