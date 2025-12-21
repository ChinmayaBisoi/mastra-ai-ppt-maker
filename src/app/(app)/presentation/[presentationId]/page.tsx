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
import { Minus, Plus } from "lucide-react";
import { Suspense, useState, useCallback, useEffect } from "react";
import { usePresentationOutline } from "@/hooks/use-presentation-outline";
import { presentationOutlineSchema } from "@/schema/ppt-outline";
import type { z } from "zod";

type PresentationOutline = z.infer<typeof presentationOutlineSchema>;

const MIN_SLIDE_COUNT = 1;
const MAX_SLIDE_COUNT = 16;

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
  const [slideCountInput, setSlideCountInput] = useState("8");
  const [description, setDescription] = useState(userInput || "");

  // Update description when userInput changes
  useEffect(() => {
    if (userInput) {
      setDescription(userInput);
    }
  }, [userInput]);

  const handleGenerateOutline = useCallback(async () => {
    if (!description.trim() || isGenerating) return;

    // Validate and clamp slideCount before submission
    const currentCount = slideCount || 8;
    const validSlideCount = Math.max(
      MIN_SLIDE_COUNT,
      Math.min(MAX_SLIDE_COUNT, Math.floor(currentCount) || 8)
    );
    if (validSlideCount !== currentCount) {
      setSlideCount(validSlideCount);
      setSlideCountInput(String(validSlideCount));
    }

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
          slideCount: validSlideCount,
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
            <Card className="border-2 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">
                  Generate Presentation Outline
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a structured outline for your presentation
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Presentation Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="E.g., A quarterly business review covering sales performance, marketing initiatives, and future goals..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slideCount" className="text-sm font-medium">
                      Number of Slides
                    </Label>
                    <span className="text-xs text-muted-foreground font-medium">
                      {slideCount || 8} {slideCount === 1 ? "slide" : "slides"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newValue = Math.max(1, slideCount - 1);
                        setSlideCount(newValue);
                        setSlideCountInput(String(newValue));
                      }}
                      disabled={isGenerating || slideCount <= 1}
                      className="h-11 w-11 shrink-0 rounded-lg border-2 hover:bg-accent hover:border-primary/50 transition-all disabled:opacity-40"
                      aria-label="Decrease slide count"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        id="slideCount"
                        type="text"
                        inputMode="numeric"
                        value={slideCountInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string, numbers, and backspace
                          if (value === "" || /^\d*$/.test(value)) {
                            setSlideCountInput(value);
                            if (value !== "") {
                              const num = parseInt(value, 10);
                              if (
                                !isNaN(num) &&
                                num >= MIN_SLIDE_COUNT &&
                                num <= MAX_SLIDE_COUNT
                              ) {
                                setSlideCount(num);
                              }
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (value === "" || value === "0") {
                            setSlideCount(8);
                            setSlideCountInput("8");
                          } else {
                            const num = parseInt(value, 10);
                            if (isNaN(num) || num < 1) {
                              setSlideCount(8);
                              setSlideCountInput("8");
                            } else if (num > MAX_SLIDE_COUNT) {
                              setSlideCount(MAX_SLIDE_COUNT);
                              setSlideCountInput(String(MAX_SLIDE_COUNT));
                            } else {
                              setSlideCount(num);
                              setSlideCountInput(String(num));
                            }
                          }
                        }}
                        disabled={isGenerating}
                        className="h-11 text-center font-semibold text-lg focus-visible:ring-2 focus-visible:ring-primary/20 border-2"
                        placeholder="8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newValue = Math.min(
                          MAX_SLIDE_COUNT,
                          slideCount + 1
                        );
                        setSlideCount(newValue);
                        setSlideCountInput(String(newValue));
                      }}
                      disabled={isGenerating || slideCount >= MAX_SLIDE_COUNT}
                      className="h-11 w-11 shrink-0 rounded-lg border-2 hover:bg-accent hover:border-primary/50 transition-all disabled:opacity-40"
                      aria-label="Increase slide count"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                    <span className="font-medium">Min: 1</span>
                    <span className="text-center italic">
                      Recommended: 8-15
                    </span>
                    <span className="font-medium">Max: {MAX_SLIDE_COUNT}</span>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateOutline}
                  disabled={
                    !description.trim() ||
                    isGenerating ||
                    !slideCount ||
                    slideCount < MIN_SLIDE_COUNT ||
                    slideCount > MAX_SLIDE_COUNT ||
                    slideCountInput === "" ||
                    slideCountInput === "0"
                  }
                  className="w-full h-11 text-base font-medium shadow-sm hover:shadow transition-shadow"
                  size="lg"
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
