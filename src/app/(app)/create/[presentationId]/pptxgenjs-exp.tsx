"use client";

import BreadcrumbHeader from "@/components/breadcrumb-header";
import PageLayout from "@/components/layouts/page-layout";

import { Suspense } from "react";
import pptxgen from "pptxgenjs";
import { z } from "zod";

// Helper function to convert image URL to base64
async function imageToBase64(imagePath: string): Promise<string> {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Return full data URL (e.g., "data:image/jpeg;base64,...")
      // pptxgenjs accepts both data URLs and plain base64 strings
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

type TextElement = pptxgen.TextProps & {
  type: "text";
};

type Slide = {
  background: pptxgen.BackgroundProps;
  elements: pptxgen.TextProps[];
};

const textPropSchema = z.object({
  // Position & Size
  x: z.number().optional(),
  y: z.number().optional(),
  w: z.number().optional(),
  h: z.number().optional(),
  // Text styling
  fontSize: z.number().optional(),
  fontFace: z.string().optional(),
  color: z.string().optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  // Alignment
  align: z.enum(["left", "center", "right", "justify"]).optional(),
  valign: z.enum(["top", "middle", "bottom"]).optional(),
  // Spacing
  lineSpacing: z.number().optional(),
  lineSpacingMultiple: z.number().optional(),
  // Other properties
  breakLine: z.boolean().optional(),
  bullet: z.boolean().optional(),
  bulletType: z.string().optional(),
  hyperlink: z.string().optional(),
  // rtlMode: z.boolean().optional(),
  lang: z.string().optional(),
  charSpacing: z.number().optional(),
  // paraSpaceAfter: z.number().optional(),
  // paraSpaceBefore: z.number().optional(),
  margin: z.number().optional(),
  marginPt: z.number().optional(),
  // indentLevel: z.number().optional(),
  // tabStops: z.array(z.number()).optional(),
  fill: z.union([z.string(), z.object({}).passthrough()]).optional(),
  shadow: z.union([z.object({}).passthrough(), z.boolean()]).optional(),
  glow: z.union([z.object({}).passthrough(), z.boolean()]).optional(),
  outline: z.union([z.object({}).passthrough(), z.boolean()]).optional(),
  shape: z.string().optional(),
  rectRadius: z.number().optional(),
  rotate: z.number().optional(),
});

const TOKENS = {
  font: {
    primary: "Inter",
  },
  size: {
    h1: 44,
    h2: 30,
    h3: 22,
    body: 16,
    metric: 36,
  },
  color: {
    primary: "111827",
    secondary: "6B7280",
    accent: "2563EB",
    muted: "9CA3AF",
    success: "16A34A",
  },
};

function coverSlide(
  slide: pptxgen.Slide,
  { title, subtitle }: { title: string; subtitle: string }
) {
  slide.addText(title, {
    x: "10%",
    y: "40%",
    w: "80%",
    align: "center",
    fontSize: TOKENS.size.h1,
    bold: true,
    fontFace: TOKENS.font.primary,
    color: TOKENS.color.primary,
  });

  slide.addText(subtitle, {
    x: "15%",
    y: "50%",
    w: "70%",
    align: "center",
    fontSize: TOKENS.size.h3,
    fontFace: TOKENS.font.primary,
    color: TOKENS.color.secondary,
  });
}
function slideWithTextAndImage(
  slide: pptxgen.Slide,
  { title, imageBase64 }: { title: string; imageBase64: string },
  textOnLeftSide: boolean = true
) {
  const TEXT_WIDTH = "60%";
  const IMAGE_WIDTH = "40%";
  const SLIDE_HEIGHT = "100%";
  const PADDING_X = 5;
  const TITLE_Y = "12%";

  const textX: pptxgen.Coord = textOnLeftSide ? "0%" : "40%";
  const imageX: pptxgen.Coord = textOnLeftSide ? "60%" : "0%";

  // Text container (left or right)
  slide.addText(title, {
    x: textX,
    y: TITLE_Y,
    w: TEXT_WIDTH,
    h: "30%",
    margin: [0, PADDING_X, 0, PADDING_X],
    fontSize: TOKENS.size.h1,
    bold: true,
    color: TOKENS.color.primary,
    align: "left",
    valign: "top",
  });

  // Image container (full height column)
  slide.addImage({
    x: imageX,
    y: "0%",
    w: IMAGE_WIDTH,
    h: SLIDE_HEIGHT,
    data: imageBase64,
    sizing: {
      type: "cover",
      w: IMAGE_WIDTH,
      h: SLIDE_HEIGHT,
    },
  });
}

function sectionDividerSlide(
  slide: pptxgen.Slide,
  { title }: { title: string }
) {
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.18,
    h: "100%",
    fill: { color: TOKENS.color.accent },
  });

  slide.addText(title, {
    x: "15%",
    y: "42%",
    w: "70%",
    fontSize: TOKENS.size.h1,
    bold: true,
    fontFace: TOKENS.font.primary,
    color: TOKENS.color.primary,
  });
}

function problemSlide(
  slide: pptxgen.Slide,
  { title, points }: { title: string; points: string[] }
) {
  slide.addText(title, {
    x: "8%",
    y: "10%",
    w: "84%",
    fontSize: TOKENS.size.h2,
    bold: true,
    color: TOKENS.color.primary,
  });

  slide.addText(points.map((p) => `• ${p}`).join("\n"), {
    x: "8%",
    y: "28%",
    w: "70%",
    fontSize: TOKENS.size.body,
    color: TOKENS.color.secondary,
    lineSpacing: 26,
  });
}

function solutionSlide(
  slide: pptxgen.Slide,
  { title, description }: { title: string; description: string }
) {
  slide.addText(title, {
    x: "8%",
    y: "12%",
    w: "84%",
    fontSize: TOKENS.size.h2,
    bold: true,
    color: TOKENS.color.primary,
  });

  slide.addText(description, {
    x: "15%",
    y: "35%",
    w: "70%",
    fontSize: TOKENS.size.h3,
    color: TOKENS.color.secondary,
    lineSpacing: 30,
  });
}

function metricsSlide(
  slide: pptxgen.Slide,
  {
    title,
    metrics,
  }: { title: string; metrics: { value: string; label: string }[] }
) {
  slide.addText(title, {
    x: "8%",
    y: "8%",
    w: "84%",
    fontSize: TOKENS.size.h2,
    bold: true,
  });

  metrics.forEach((m, i) => {
    const x = 10 + i * 27;

    slide.addText(m.value, {
      x: `${x}%`,
      y: "30%",
      w: "20%",
      align: "center",
      fontSize: TOKENS.size.metric,
      bold: true,
      color: TOKENS.color.success,
    });

    slide.addText(m.label, {
      x: `${x}%`,
      y: "42%",
      w: "20%",
      align: "center",
      fontSize: TOKENS.size.body,
      color: TOKENS.color.secondary,
    });
  });
}

function comparisonSlide(
  slide: pptxgen.Slide,
  {
    leftTitle,
    rightTitle,
    leftPoints,
    rightPoints,
  }: {
    leftTitle: string;
    rightTitle: string;
    leftPoints: string[];
    rightPoints: string[];
  }
) {
  slide.addText(leftTitle, {
    x: "8%",
    y: "10%",
    w: "35%",
    fontSize: TOKENS.size.h3,
    bold: true,
  });

  slide.addText(rightTitle, {
    x: "57%",
    y: "10%",
    w: "35%",
    fontSize: TOKENS.size.h3,
    bold: true,
  });

  slide.addText(leftPoints.map((p) => `• ${p}`).join("\n"), {
    x: "8%",
    y: "25%",
    w: "35%",
    fontSize: TOKENS.size.body,
    color: TOKENS.color.secondary,
    lineSpacing: 24,
  });

  slide.addText(rightPoints.map((p) => `• ${p}`).join("\n"), {
    x: "57%",
    y: "25%",
    w: "35%",
    fontSize: TOKENS.size.body,
    color: TOKENS.color.secondary,
    lineSpacing: 24,
  });
}

function ctaSlide(
  slide: pptxgen.Slide,
  { title, subtitle }: { title: string; subtitle: string }
) {
  slide.addText(title, {
    x: "10%",
    y: "38%",
    w: "80%",
    align: "center",
    fontSize: TOKENS.size.h1,
    bold: true,
    color: TOKENS.color.primary,
  });

  slide.addText(subtitle, {
    x: "20%",
    y: "52%",
    w: "60%",
    align: "center",
    fontSize: TOKENS.size.h3,
    color: TOKENS.color.secondary,
  });
}

function ReactPptxEditor() {
  async function generatePptx() {
    const pptx = new pptxgen();

    const commonBgColor = "F5F5DC";

    const slide1 = pptx.addSlide();

    // Set light beige background
    slide1.background = { color: commonBgColor }; // Beige color

    // Main title "Pitch Deck" - centered, large serif font
    // Slide dimensions (default: 10 x 5.625 inches)
    const SLIDE_WIDTH = 10;
    const SLIDE_HEIGHT = 5.625;

    // Layout sizing
    const contentWidth = 8;
    const titleHeight = 1.2;
    const subtitleHeight = 0.9;
    const gap = 0.1;

    // Center horizontally
    const x = (SLIDE_WIDTH - contentWidth) / 2;

    // Center vertically (group centering)
    const totalHeight = titleHeight + gap + subtitleHeight;
    const startYOffset = -0.3;
    const startY = (SLIDE_HEIGHT - totalHeight) / 2 + startYOffset;

    coverSlide(slide1, {
      title: "Pitch Deck",
      subtitle: "New Business Opportunity",
    });

    const slide2 = pptx.addSlide();
    slide2.background = { color: commonBgColor };

    // Convert image to base64
    const imageBase64 = await imageToBase64("/bg.jpg");

    slideWithTextAndImage(slide2, {
      title: "The Problem",
      imageBase64: imageBase64,
    });

    const slide3 = pptx.addSlide();
    slide3.background = { color: commonBgColor };
    problemSlide(slide3, {
      title: "The Problem",
      points: ["Problem 1", "Problem 2", "Problem 3"],
    });

    const slide4 = pptx.addSlide();
    slide4.background = { color: commonBgColor };
    solutionSlide(slide4, {
      title: "The Solution",
      description: "The Solution is to...",
    });

    const slide5 = pptx.addSlide();
    slide5.background = { color: commonBgColor };
    metricsSlide(slide5, {
      title: "The Metrics",
      metrics: [
        { value: "100", label: "Metric 1" },
        { value: "200", label: "Metric 2" },
        { value: "300", label: "Metric 3" },
      ],
    });

    const slide6 = pptx.addSlide();
    slide6.background = { color: commonBgColor };
    comparisonSlide(slide6, {
      leftTitle: "The Comparison",
      rightTitle: "The Comparison",
      leftPoints: ["Left Point 1", "Left Point 2", "Left Point 3"],
      rightPoints: ["Right Point 1", "Right Point 2", "Right Point 3"],
    });

    const slide7 = pptx.addSlide();
    slide7.background = { color: commonBgColor };
    ctaSlide(slide7, {
      title: "The CTA",
      subtitle: "The CTA is to...",
    });

    console.log(pptx);

    return pptx.writeFile({ fileName: "presentation.pptx" });
  }
  return (
    <div>
      <h1>Hello</h1>
      <button onClick={() => generatePptx()}>Generate PPTX</button>
    </div>
  );
}

export default function PresentationEditorPage() {
  return (
    <Suspense fallback={<div>Suspense Loading...</div>}>
      <BreadcrumbHeader title="Create" href="/create" />
      <PageLayout
        title="Create Presentation"
        description="Design beautiful presentations with AI assistance"
      >
        <div className="">
          {/* <CanvaEditor /> */}
          <ReactPptxEditor />
        </div>
      </PageLayout>
    </Suspense>
  );
}
