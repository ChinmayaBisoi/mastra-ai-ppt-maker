"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { presentationOutlineSchema } from "@/schema/ppt-outline";
import type { z } from "zod";

type PresentationOutline = z.infer<typeof presentationOutlineSchema>;

interface OutlineEditorProps {
  outline: PresentationOutline | null;
  onSave: (outline: PresentationOutline) => void;
  isStreaming?: boolean;
  streamedText?: string;
}

export function OutlineEditor({
  outline,
  onSave,
  isStreaming = false,
  streamedText = "",
}: OutlineEditorProps) {
  const [editableOutline, setEditableOutline] =
    useState<PresentationOutline | null>(outline);

  useEffect(() => {
    if (outline) {
      setEditableOutline(outline);
    }
  }, [outline]);

  const handleSlideChange = (
    slideIndex: number,
    field: "title" | "keyPoints",
    value: string | string[]
  ) => {
    if (!editableOutline) return;

    const updated = { ...editableOutline };
    updated.slides[slideIndex] = {
      ...updated.slides[slideIndex],
      [field]: value,
    };
    setEditableOutline(updated);
  };

  const handleKeyPointChange = (
    slideIndex: number,
    pointIndex: number,
    value: string
  ) => {
    if (!editableOutline) return;

    const updated = { ...editableOutline };
    const newKeyPoints = [...updated.slides[slideIndex].keyPoints];
    newKeyPoints[pointIndex] = value;
    updated.slides[slideIndex].keyPoints = newKeyPoints;
    setEditableOutline(updated);
  };

  const handleAddKeyPoint = (slideIndex: number) => {
    if (!editableOutline) return;

    const updated = { ...editableOutline };
    updated.slides[slideIndex].keyPoints.push("");
    setEditableOutline(updated);
  };

  const handleRemoveKeyPoint = (slideIndex: number, pointIndex: number) => {
    if (!editableOutline) return;

    const updated = { ...editableOutline };
    updated.slides[slideIndex].keyPoints = updated.slides[
      slideIndex
    ].keyPoints.filter((_, i) => i !== pointIndex);
    setEditableOutline(updated);
  };

  const handleSave = () => {
    if (editableOutline) {
      onSave(editableOutline);
    }
  };

  if (isStreaming && !outline) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Generating Outline...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {streamedText}
              <span className="animate-pulse">▊</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!editableOutline) {
    return null;
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Presentation Outline</CardTitle>
        <Button onClick={handleSave} disabled={isStreaming}>
          Save Outline
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {editableOutline.summary && (
          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea
              value={editableOutline.summary}
              onChange={(e) =>
                setEditableOutline({
                  ...editableOutline,
                  summary: e.target.value,
                })
              }
              rows={3}
            />
          </div>
        )}

        <div className="space-y-6">
          {editableOutline.slides.map((slide, slideIndex) => (
            <Card key={slide.slideNumber}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Slide {slide.slideNumber}
                  </span>
                </div>
                <Input
                  value={slide.title}
                  onChange={(e) =>
                    handleSlideChange(slideIndex, "title", e.target.value)
                  }
                  placeholder="Slide title"
                  className="text-lg font-semibold"
                />
              </CardHeader>
              <CardContent className="space-y-3">
                <Label>Key Points</Label>
                {slide.keyPoints.map((point, pointIndex) => (
                  <div key={pointIndex} className="flex gap-2">
                    <Textarea
                      value={point}
                      onChange={(e) =>
                        handleKeyPointChange(
                          slideIndex,
                          pointIndex,
                          e.target.value
                        )
                      }
                      placeholder={`Key point ${pointIndex + 1}`}
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleRemoveKeyPoint(slideIndex, pointIndex)
                      }
                      disabled={slide.keyPoints.length <= 2}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddKeyPoint(slideIndex)}
                  disabled={slide.keyPoints.length >= 4}
                >
                  + Add Key Point
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
