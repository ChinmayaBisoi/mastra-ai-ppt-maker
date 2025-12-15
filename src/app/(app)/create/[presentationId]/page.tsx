"use client";

import { useState } from "react";
import BreadcrumbHeader from "@/components/breadcrumb-header";
import PageLayout from "@/components/layouts/page-layout";
import { PresentationSlideViewer } from "@/components/presentation-slide-viewer";
import type { Slide } from "@/types/slide";
import slide1 from "@/app/templates/1.1-pitch-intro.json";
import slide2 from "@/app/templates/1.2-cover.json";
import slide3 from "@/app/templates/1.3-agenda.json";
import slide4 from "@/app/templates/1.4-our-mission.json";
import slide5 from "@/app/templates/1.5-meet-the-team.json";
import slide6 from "@/app/templates/1.6-product-slide.json";
import slide7 from "@/app/templates/1.7-competitive-analysis.json";
import slide8 from "@/app/templates/1.8-our-numbers.json";
import slide9 from "@/app/templates/1.9-path-to-integration.json";
import { Suspense } from "react";

const mockSlides: Slide[] = [
  slide1,
  slide2,
  slide3,
  slide4,
  slide5,
  slide6,
  slide7,
  slide8,
  slide9,
] as unknown as Slide[];

export default function PresentationEditorPage() {
  // Convert the mock data format to our slide format
  const [slides, setSlides] = useState<Slide[]>(mockSlides);

  console.log(slides);

  return (
    <Suspense fallback={<div>Suspense Loading...</div>}>
      <BreadcrumbHeader title="Create" href="/create" />
      <PageLayout
        title="Create Presentation"
        description="Design beautiful presentations with AI assistance"
      >
        <div className="h-[calc(100vh-200px)]">
          <PresentationSlideViewer slides={slides} onSlidesChange={setSlides} />
        </div>
      </PageLayout>
    </Suspense>
  );
}
