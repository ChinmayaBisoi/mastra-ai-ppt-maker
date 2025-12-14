import BreadcrumbHeader from "@/components/breadcrumb-header";
import PageLayout from "@/components/layouts/page-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Suspense } from "react";

export default function PresentationsPage() {
  return (
    <Suspense fallback={<div>Suspense Loading...</div>}>
      <BreadcrumbHeader title="My Presentations" href="/presentations" />
      <PageLayout
        title="My Presentations"
        description="View and manage all your presentations"
      >
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <div>PresentationsList</div>
        </Suspense>
      </PageLayout>
    </Suspense>
  );
}
