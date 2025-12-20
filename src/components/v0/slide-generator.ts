import type { z } from "zod";
import { presentationOutlineSchema } from "@/schema/ppt-outline";
import { DESIGN_STYLES } from "@/constants/presentation-styles";

type PresentationOutline = z.infer<typeof presentationOutlineSchema>;
type Slide = { code: string };

export interface DesignStyle {
  designGuide?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    gradient?: string;
  };
}

export interface GenerateSlideOptions {
  slideMetadata: {
    slideNumber: number;
    title: string;
    keyPoints: string[];
  };
  designStyle?: DesignStyle;
  colors?: Record<string, string>;
  onChunk?: (chunk: string) => void;
}

export async function generateSingleSlide(
  options: GenerateSlideOptions
): Promise<string> {
  const { slideMetadata, designStyle, colors, onChunk } = options;

  const response = await fetch("/api/generate-slide", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slideMetadata,
      designStyle,
      colors,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate slide");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  let fullHtml = "";
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
            fullHtml += data.chunk;
            onChunk?.(data.chunk);
          } else if (data.type === "complete") {
            if (data.html) {
              fullHtml = data.html;
            }
          }
        } catch (e) {
          console.error("Error parsing SSE data:", e);
        }
      }
    }
  }

  return fullHtml;
}

export async function generateSlidesSequentially(
  outline: PresentationOutline,
  designStyle?: DesignStyle,
  colors?: Record<string, string>,
  onProgress?: (index: number, total: number, html: string) => void
): Promise<Slide[]> {
  const slides: Slide[] = [];

  for (let index = 0; index < outline.slides.length; index++) {
    const slideMetadata = outline.slides[index];

    console.log(`🧠 Generating slide ${index + 1}/${outline.slides.length}...`);

    try {
      let currentHtml = "";
      const html = await generateSingleSlide({
        slideMetadata,
        // designStyle: (designStyle ??
        //   DESIGN_STYLES[0]?.designGuide) as DesignStyle,
        designStyle,
        colors,
        onChunk: (chunk) => {
          currentHtml += chunk;
          onProgress?.(index, outline.slides.length, currentHtml);
        },
      });

      slides[index] = { code: html };
      console.log(`✅ Finished slide ${index + 1}`);
    } catch (error) {
      console.error(`❌ Error generating slide ${index + 1}:`, error);
      // Add empty slide on error so generation can continue
      slides[index] = { code: "" };
    }
  }

  console.log("🎉 All slides generated!");
  return slides;
}
