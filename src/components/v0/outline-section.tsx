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
}: OutlineSectionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Presentation Outline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Loading outline...
          </div>
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
    <Card className="h-full border-0 shadow-sm gap-0 overflow-y-auto">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-xl font-semibold">
          Presentation Outline
        </CardTitle>
        {outline.summary && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {outline.summary}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {outline.slides.map((slide) => (
          <Card
            key={slide.slideNumber}
            className="border border-border/50 hover:border-primary/50 transition-colors duration-200 shadow-sm hover:shadow-md rounded-none"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {slide.slideNumber}
                </span>
              </div>
              <CardTitle className="text-base font-medium leading-tight">
                {slide.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {slide.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1.5 shrink-0">•</span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
