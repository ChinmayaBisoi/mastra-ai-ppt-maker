"use client";

import BreadcrumbHeader from "@/components/breadcrumb-header";
import PageLayout from "@/components/layouts/page-layout";

import { Suspense } from "react";

export default function PresentationEditorPage() {
  return (
    <Suspense fallback={<div>Suspense Loading...</div>}>
      <BreadcrumbHeader title="Create" href="/create" />
      <PageLayout
        title="Create Presentation"
        description="Design beautiful presentations with AI assistance"
      >
        <div className="">Hello</div>
      </PageLayout>
    </Suspense>
  );
}
