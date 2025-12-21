"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { DocumentDeleteDialog } from "./document-delete-dialog";
import { DocumentReprocessDialog } from "./document-reprocess-dialog";
import { DocumentStatusSummary } from "./document-status-summary";
import { DocumentListItem } from "./document-list-item";
import { toast } from "sonner";

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  processedAt: string | null;
}

interface DocumentStatus {
  exists: boolean;
  fileName?: string;
  uploadedAt?: string;
  processedAt?: string | null;
  isProcessed: boolean;
  chunkCount: number;
  status:
    | "not_processed"
    | "fully_processed"
    | "marked_processed_but_no_chunks"
    | "chunks_exist_but_not_marked";
  warning?: "low_chunk_count" | "single_chunk" | null;
}

interface PresentationStatusSummary {
  total: number;
  processed: number;
  notProcessed: number;
  totalChunks: number;
  documents: (DocumentStatus & { documentId: string })[];
}

interface DocumentListProps {
  presentationId: string;
  onDocumentDeleted?: () => void;
}

export function DocumentList({
  presentationId,
  onDocumentDeleted,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );
  const [reprocessDialogOpen, setReprocessDialogOpen] = useState(false);
  const [documentToReprocess, setDocumentToReprocess] =
    useState<Document | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [reprocessingIds, setReprocessingIds] = useState<Set<string>>(
    new Set()
  );
  const [documentStatuses, setDocumentStatuses] = useState<
    Map<string, DocumentStatus>
  >(new Map());
  const [statusSummary, setStatusSummary] =
    useState<PresentationStatusSummary | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState<Set<string>>(new Set());

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/presentation/${presentationId}/documents`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to fetch documents";
        console.error("Error fetching documents:", errorMessage);
        setDocuments([]);
        return;
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [presentationId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const fetchDocumentStatuses = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const response = await fetch(
        `/api/presentation/${presentationId}/documents/status`
      );
      if (response.ok) {
        const summary: PresentationStatusSummary = await response.json();
        setStatusSummary(summary);
        const statusMap = new Map<string, DocumentStatus>();
        summary.documents.forEach((doc) => {
          if (doc.exists && doc.documentId) {
            statusMap.set(doc.documentId, doc);
          }
        });
        setDocumentStatuses(statusMap);
      }
    } catch (error) {
      console.error("Error fetching document statuses:", error);
    } finally {
      setLoadingStatus(false);
    }
  }, [presentationId]);

  const fetchSingleDocumentStatus = useCallback(
    async (documentId: string) => {
      try {
        const response = await fetch(
          `/api/presentation/${presentationId}/documents/${documentId}/status`
        );
        if (response.ok) {
          const status: DocumentStatus = await response.json();
          setDocumentStatuses((prev) => {
            const next = new Map(prev);
            next.set(documentId, status);
            return next;
          });
          return status;
        }
      } catch (error) {
        console.error("Error fetching document status:", error);
      }
      return null;
    },
    [presentationId]
  );

  const toggleStatusExpansion = (documentId: string) => {
    setExpandedStatus((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
        if (!documentStatuses.has(documentId)) {
          fetchSingleDocumentStatus(documentId);
        }
      }
      return next;
    });
  };

  const openDeleteDialog = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    if (documentToDelete) {
      setDocuments(documents.filter((doc) => doc.id !== documentToDelete.id));
      onDocumentDeleted?.();
    }
    setDocumentToDelete(null);
  };

  const handleProcessDocument = async (document: Document) => {
    setProcessingIds((prev) => new Set(prev).add(document.id));

    try {
      const response = await fetch(
        `/api/presentation/${presentationId}/documents/${document.id}/process`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process document");
      }

      const data = await response.json();

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === document.id
            ? { ...doc, processedAt: data.document.processedAt }
            : doc
        )
      );

      await fetchSingleDocumentStatus(document.id);

      toast.success("Document processed successfully", {
        description: `${document.fileName} has been processed and is ready for RAG search.`,
      });
    } catch (error) {
      console.error("Error processing document:", error);
      toast.error("Failed to process document", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to process document. Please try again.",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(document.id);
        return next;
      });
    }
  };

  const openReprocessDialog = (document: Document) => {
    setDocumentToReprocess(document);
    setReprocessDialogOpen(true);
  };

  const handleReprocessSuccess = async () => {
    if (!documentToReprocess) return;

    setReprocessingIds((prev) => new Set(prev).add(documentToReprocess.id));

    try {
      await fetchDocuments();

      setDocumentStatuses((prev) => {
        const next = new Map(prev);
        next.delete(documentToReprocess.id);
        return next;
      });
      await fetchSingleDocumentStatus(documentToReprocess.id);

      toast.success("Document reprocessed successfully", {
        description: `${documentToReprocess.fileName} has been reprocessed and chunks have been regenerated.`,
      });
    } catch (error) {
      console.error("Error refreshing document after reprocess:", error);
    } finally {
      setReprocessingIds((prev) => {
        const next = new Set(prev);
        next.delete(documentToReprocess.id);
        return next;
      });
    }
  };

  const handleReprocessDialogClose = (open: boolean) => {
    setReprocessDialogOpen(open);
    if (!open) {
      setDocumentToReprocess(null);
    }
  };

  const isProcessing = (documentId: string) => {
    return processingIds.has(documentId) || reprocessingIds.has(documentId);
  };

  useEffect(() => {
    if (documents.length > 0) {
      fetchDocumentStatuses();
    }
  }, [documents.length, fetchDocumentStatuses]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documents ({documents.length})</CardTitle>
          <div className="flex items-center gap-2">
            <DocumentStatusSummary summary={statusSummary} />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDocumentStatuses}
              disabled={loadingStatus}
              title="Refresh document processing status"
            >
              {loadingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((document) => (
            <DocumentListItem
              key={document.id}
              document={document}
              status={documentStatuses.get(document.id)}
              isExpanded={expandedStatus.has(document.id)}
              isProcessing={isProcessing(document.id)}
              isReprocessing={reprocessingIds.has(document.id)}
              onToggleDetails={() => toggleStatusExpansion(document.id)}
              onProcess={() => handleProcessDocument(document)}
              onReprocess={() => openReprocessDialog(document)}
              onDelete={() => openDeleteDialog(document)}
              onFetchStatus={() => fetchSingleDocumentStatus(document.id)}
            />
          ))}
        </div>
      </CardContent>

      <DocumentDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        document={documentToDelete}
        presentationId={presentationId}
        onSuccess={handleDeleteSuccess}
      />

      <DocumentReprocessDialog
        open={reprocessDialogOpen}
        onOpenChange={handleReprocessDialogClose}
        document={documentToReprocess}
        presentationId={presentationId}
        onSuccess={handleReprocessSuccess}
      />
    </Card>
  );
}
