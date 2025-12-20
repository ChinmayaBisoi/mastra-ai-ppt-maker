"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { presentationOutlineSchema } from "@/schema/ppt-outline";
import type { z } from "zod";

type PresentationOutline = z.infer<typeof presentationOutlineSchema>;

interface OutlineSectionProps {
  outline: PresentationOutline | null;
  loading?: boolean;
  editable?: boolean;
}

export function OutlineSection({
  outline,
  loading = false,
  editable = false,
}: OutlineSectionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Presentation Outline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading outline...</div>
        </CardContent>
      </Card>
    );
  }

  if (!outline || !outline.slides || outline.slides.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Presentation Outline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No outline available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Presentation Outline</CardTitle>
        {outline.summary && (
          <p className="text-sm text-muted-foreground">{outline.summary}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {outline.slides.map((slide) => (
          <Card key={slide.slideNumber} className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Slide {slide.slideNumber}
                </span>
              </div>
              <CardTitle className="text-base">{slide.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {slide.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

