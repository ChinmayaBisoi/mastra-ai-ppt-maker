"use client";

import { useState } from "react";
import BreadcrumbHeader from "@/components/breadcrumb-header";
import PageLayout from "@/components/layouts/page-layout";

import { Suspense } from "react";

export default function PresentationEditorPage() {
  console.log(slides);

  return (
    <Suspense fallback={<div>Suspense Loading...</div>}>
      <BreadcrumbHeader title="Create" href="/create" />
      <PageLayout
        title="Create Presentation"
        description="Design beautiful presentations with AI assistance"
      >
        <div className="h-[calc(100vh-200px)]">{/*  */}</div>
      </PageLayout>
    </Suspense>
  );
}
