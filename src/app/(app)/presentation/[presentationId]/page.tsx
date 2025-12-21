"use client";

import { useParams } from "next/navigation";
import { DocumentUpload } from "@/components/presentation/document-upload";
import { DocumentList } from "@/components/presentation/document-list";
import { OutlineSection } from "@/components/v0/outline-section";
import { OutlineEditor } from "@/components/outline-editor";
import BreadcrumbHeader from "@/components/breadcrumb-header";
import PageLayout from "@/components/layouts/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Suspense, useState, useCallback, useEffect } from "react";
import { usePresentationOutline } from "@/hooks/use-presentation-outline";
import { presentationOutlineSchema } from "@/schema/ppt-outline";
import type { z } from "zod";

type PresentationOutline = z.infer<typeof presentationOutlineSchema>;

function PresentationDetails() {
  const params = useParams();
  const presentationId = params.presentationId as string;
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    outline,
    userInput,
    loading: loadingOutline,
    refetch,
  } = usePresentationOutline(presentationId);

  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [slideCount, setSlideCount] = useState(8);
  const [description, setDescription] = useState(userInput || "");

  // Update description when userInput changes
  useEffect(() => {
    if (userInput) {
      setDescription(userInput);
    }
  }, [userInput]);

  const handleGenerateOutline = useCallback(async () => {
    if (!description.trim() || isGenerating) return;

    setIsGenerating(true);
    setStreamedText("");

    try {
      const response = await fetch("/api/generate-outline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim(),
          slideCount,
          presentationId,
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
              } else if (data.type === "complete" && data.outline) {
                // Outline generated successfully, refetch to get updated data
                await refetch();
                setIsGenerating(false);
                setStreamedText("");
                return;
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating outline:", error);
      setIsGenerating(false);
      setStreamedText("");
    }
  }, [description, slideCount, presentationId, isGenerating, refetch]);

  const handleUploadComplete = () => {
    // Trigger refresh of document list
    setRefreshKey((prev) => prev + 1);
  };

  const handleDocumentDeleted = () => {
    // Document list will refresh automatically via key change
    setRefreshKey((prev) => prev + 1);
  };

  const handleOutlineSave = async (savedOutline: PresentationOutline) => {
    // Outline is saved automatically when generated
    // This handler is for future editing functionality
    console.log("Outline saved:", savedOutline);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BreadcrumbHeader title="Presentation" href="/presentation" />
      <PageLayout
        title="Presentation Details"
        description="Manage your presentation documents"
      >
        <div className="space-y-6">
          <DocumentUpload
            presentationId={presentationId}
            onUploadComplete={handleUploadComplete}
          />
          <DocumentList
            key={refreshKey}
            presentationId={presentationId}
            onDocumentDeleted={handleDocumentDeleted}
          />
          {/* User Input Display */}
          {userInput && (
            <Card>
              <CardHeader>
                <CardTitle>Presentation Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {userInput}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generate Outline Form (if no outline exists) */}
          {!loadingOutline && !outline && (
            <Card>
              <CardHeader>
                <CardTitle>Generate Presentation Outline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Presentation Description</Label>
                  <Textarea
                    id="description"
                    placeholder="E.g., A quarterly business review covering sales performance, marketing initiatives, and future goals..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slideCount">Number of Slides</Label>
                  <Input
                    id="slideCount"
                    type="number"
                    min={1}
                    max={50}
                    value={slideCount}
                    onChange={(e) =>
                      setSlideCount(parseInt(e.target.value) || 8)
                    }
                    disabled={isGenerating}
                  />
                </div>
                <Button
                  onClick={handleGenerateOutline}
                  disabled={!description.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? "Generating..." : "Generate Outline"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Outline Display/Editor */}
          {outline ? (
            <OutlineEditor
              outline={outline}
              onSave={handleOutlineSave}
              isStreaming={isGenerating}
              streamedText={streamedText}
            />
          ) : isGenerating ? (
            <OutlineEditor
              outline={null}
              onSave={() => {}}
              isStreaming={true}
              streamedText={streamedText}
            />
          ) : (
            <OutlineSection outline={null} loading={loadingOutline} />
          )}
        </div>
      </PageLayout>
    </Suspense>
  );
}

export default PresentationDetails;
