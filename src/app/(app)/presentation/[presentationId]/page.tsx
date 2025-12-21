"use client";

import { useParams } from "next/navigation";
import { DocumentUpload } from "@/components/presentation/document-upload";
import { DocumentList } from "@/components/presentation/document-list";
import BreadcrumbHeader from "@/components/breadcrumb-header";
import PageLayout from "@/components/layouts/page-layout";
import { Suspense, useState } from "react";

function PresentationDetails() {
  const params = useParams();
  const presentationId = params.presentationId as string;
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    // Trigger refresh of document list
    setRefreshKey((prev) => prev + 1);
  };

  const handleDocumentDeleted = () => {
    // Document list will refresh automatically via key change
    setRefreshKey((prev) => prev + 1);
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
        </div>
      </PageLayout>
    </Suspense>
  );
}

export default PresentationDetails;
