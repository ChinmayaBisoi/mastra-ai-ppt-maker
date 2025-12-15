"use client";

import { useState, useEffect, useCallback } from "react";
import type { Slide, Position } from "@/types/slide";
import { DraggableSlideElement } from "@/components/draggable-slide-element";
import { SlideNavigator } from "@/components/slide-navigator";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import { generatePptxFromSlides } from "@/lib/pptx-generator";
import { cn } from "@/lib/utils";

interface PresentationSlideViewerProps {
  slides: Slide[];
  onSlidesChange?: (slides: Slide[]) => void;
  className?: string;
}

// 16:9 aspect ratio dimensions in inches (standard presentation size)
const SLIDE_WIDTH_INCHES = 10;
const SLIDE_HEIGHT_INCHES = 5.625;
const INCH_TO_PX = 96;

export function PresentationSlideViewer({
  slides: initialSlides,
  onSlidesChange,
  className,
}: PresentationSlideViewerProps) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  const currentSlide = slides[currentSlideIndex];

  // Update slides when initialSlides changes
  useEffect(() => {
    setSlides(initialSlides);
  }, [initialSlides]);

  const goToPrevious = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentSlideIndex((prev) =>
      prev < slides.length - 1 ? prev + 1 : prev
    );
  }, [slides.length]);

  const handleElementPositionChange = useCallback(
    (elementId: string, newPosition: Position) => {
      setSlides((prevSlides) => {
        const updatedSlides = prevSlides.map((slide, slideIndex) => {
          if (slideIndex === currentSlideIndex) {
            return {
              ...slide,
              elements: slide.elements.map((element) =>
                element.id === elementId
                  ? { ...element, position: newPosition }
                  : element
              ),
            };
          }
          return slide;
        });

        onSlidesChange?.(updatedSlides);
        return updatedSlides;
      });
    },
    [currentSlideIndex, onSlidesChange]
  );

  const handleSaveJson = useCallback(() => {
    setIsSaving(true);
    try {
      const jsonData = {
        slide: currentSlide,
      };
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `presentation-${currentSlide.id || currentSlideIndex + 1}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error saving JSON:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentSlide, currentSlideIndex]);

  const handleDownloadPptx = useCallback(async () => {
    setIsDownloading(true);
    try {
      const blob = await generatePptxFromSlides(
        slides,
        `presentation-${Date.now()}`
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `presentation-${Date.now()}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PPTX:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [slides]);

  const handleElementClick = useCallback(
    (elementId: string, e: React.MouseEvent) => {
      // Only select if not dragging
      if (!isDragging) {
        e.stopPropagation();
        setSelectedElementId((prev) => (prev === elementId ? null : elementId));
      }
    },
    [isDragging]
  );

  const handleSlideContainerClick = useCallback(() => {
    // Deselect when clicking on slide background
    if (!isDragging) {
      setSelectedElementId(null);
    }
  }, [isDragging]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && !isDragging) {
        goToPrevious();
      } else if (e.key === "ArrowRight" && !isDragging) {
        goToNext();
      } else if (e.key === "Escape") {
        setSelectedElementId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, isDragging]);

  if (!currentSlide) {
    return null;
  }

  const slideWidthPx = SLIDE_WIDTH_INCHES * INCH_TO_PX;
  const slideHeightPx = SLIDE_HEIGHT_INCHES * INCH_TO_PX;

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b">
        <SlideNavigator
          currentSlide={currentSlideIndex}
          totalSlides={slides.length}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveJson}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save JSON"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPptx}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Generating..." : "Download PPTX"}
          </Button>
        </div>
      </div>

      {/* Slide Container */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gray-100 dark:bg-gray-900">
        <div
          data-slide-container
          className="relative bg-white shadow-2xl"
          style={{
            width: `${slideWidthPx}px`,
            height: `${slideHeightPx}px`,
            backgroundColor: currentSlide.background?.color || "#FFFFFF",
            overflow: "hidden",
          }}
          onClick={handleSlideContainerClick}
        >
          {currentSlide.elements?.map((element) => (
            <DraggableSlideElement
              key={element.id}
              element={element}
              scale={INCH_TO_PX}
              onPositionChange={handleElementPositionChange}
              isDragging={isDragging}
              isSelected={selectedElementId === element.id}
              isHovered={hoveredElementId === element.id}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              onClick={handleElementClick}
              onMouseEnter={() => setHoveredElementId(element.id)}
              onMouseLeave={() => setHoveredElementId(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
