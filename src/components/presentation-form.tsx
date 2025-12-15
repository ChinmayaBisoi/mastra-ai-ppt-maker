"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { OutlineEditor } from "@/components/outline-editor";
import { presentationOutlineSchema } from "@/schema/ppt-outline";
import type { z } from "zod";

type PresentationOutline = z.infer<typeof presentationOutlineSchema>;

export function PresentationForm() {
  const [description, setDescription] = useState("");
  const [slideCount, setSlideCount] = useState("8");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [outline, setOutline] = useState<PresentationOutline | null>(null);

  const handleGenerateOutline = async () => {
    setIsGenerating(true);
    setStreamedText("");
    setOutline(null);

    try {
      const response = await fetch("/api/generate-outline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          slideCount: parseInt(slideCount, 10),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate outline");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === "chunk") {
                setStreamedText((prev) => prev + data.chunk);
              } else if (data.type === "complete") {
                if (data.outline) {
                  setOutline(data.outline);
                } else if (data.text) {
                  // Try to parse the text as JSON
                  try {
                    const jsonMatch = data.text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      const parsed = JSON.parse(jsonMatch[0]);
                      const validated = presentationOutlineSchema.parse(parsed);
                      setOutline(validated);
                    }
                  } catch {
                    // If parsing fails, keep the text
                    setStreamedText(data.text);
                  }
                }
                setIsGenerating(false);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating outline:", error);
      setIsGenerating(false);
    }
  };

  const handleSaveOutline = (savedOutline: PresentationOutline) => {
    console.log("Saving outline:", savedOutline);
    // TODO: Implement actual save logic
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Presentation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Describe your presentation</Label>
            <Textarea
              id="description"
              placeholder="E.g., A quarterly business review covering sales performance, marketing initiatives, and future goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slide-count">Number of slides</Label>
            <Select value={slideCount} onValueChange={setSlideCount}>
              <SelectTrigger id="slide-count" className="w-full">
                <SelectValue placeholder="Select number of slides" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 13 }, (_, i) => i + 4).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "slide" : "slides"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateOutline}
            className="w-full"
            size="lg"
            disabled={!description.trim() || isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Outline"}
          </Button>
        </CardContent>
      </Card>

      {(isGenerating || outline) && (
        <OutlineEditor
          outline={outline}
          onSave={handleSaveOutline}
          isStreaming={isGenerating}
          streamedText={streamedText}
        />
      )}
    </div>
  );
}
