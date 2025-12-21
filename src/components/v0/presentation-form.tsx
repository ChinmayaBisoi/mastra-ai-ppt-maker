"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PresentationForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!description.trim()) return;

    setIsCreating(true);

    try {
      const response = await fetch("/api/presentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput: description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create presentation");
      }

      const presentation = await response.json();
      router.push(`/presentation/${presentation.id}`);
    } catch (error) {
      console.error("Error creating presentation:", error);
      setIsCreating(false);
    }
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

          <Button
            onClick={handleCreate}
            className="w-full"
            size="lg"
            disabled={!description.trim() || isCreating}
          >
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
