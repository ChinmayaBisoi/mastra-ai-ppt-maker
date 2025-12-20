import BreadcrumbHeader from "@/components/breadcrumb-header";
import PageLayout from "@/components/layouts/page-layout";
import { PresentationsList } from "@/components/presentations-list";
import { Suspense } from "react";

export default function PresentationsPage() {
  return (
    <Suspense fallback={<div>Suspense Loading...</div>}>
      <BreadcrumbHeader title="My Presentations" href="/presentations" />
      <PageLayout
        title="My Presentations"
        description="View and manage all your presentations"
      >
        <PresentationsList />
      </PageLayout>
    </Suspense>
  );
}
