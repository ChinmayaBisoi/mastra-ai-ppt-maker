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

export function PresentationForm() {
  const [description, setDescription] = useState("");
  const [slideCount, setSlideCount] = useState("8");

  const handleGenerateOutline = () => {
    console.log("Description:", description);
    console.log("Slide Count:", slideCount);
  };

  return (
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
          disabled={!description.trim()}
        >
          Generate Outline
        </Button>
      </CardContent>
    </Card>
  );
}
