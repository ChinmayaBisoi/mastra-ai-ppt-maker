"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SlideNavigatorProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export function SlideNavigator({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  className,
}: SlideNavigatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={onPrevious}
        disabled={currentSlide === 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[100px] text-center">
        {currentSlide + 1} / {totalSlides}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={currentSlide === totalSlides - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

