"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { DocumentDeleteDialog } from "./document-delete-dialog";
import { Badge } from "@/components/ui/badge";
// Removed date-fns import - using native Date formatting

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  processedAt: string | null;
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
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/presentations/${presentationId}/documents`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to fetch documents";
        console.error("Error fetching documents:", errorMessage);
        // Don't throw - just log and show empty state
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
  }, [presentationId, fetchDocuments]);

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
        `/api/presentations/${presentationId}/documents/${document.id}/process`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process document");
      }

      const data = await response.json();

      // Update document in state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === document.id
            ? { ...doc, processedAt: data.document.processedAt }
            : doc
        )
      );
    } catch (error) {
      console.error("Error processing document:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to process document. Please try again."
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(document.id);
        return next;
      });
    }
  };

  const isProcessing = (documentId: string) => {
    return processingIds.has(documentId);
  };

  const getProcessingStatus = (document: Document) => {
    if (isProcessing(document.id)) {
      return { status: "processing", label: "Processing..." };
    }
    if (document.processedAt) {
      return { status: "processed", label: "Processed" };
    }
    return { status: "pending", label: "Not Processed" };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

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
        <CardTitle>Documents ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(document.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {document.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span>•</span>
                    <span>
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    {(() => {
                      const { status, label } = getProcessingStatus(document);
                      return (
                        <Badge
                          variant={
                            status === "processed"
                              ? "default"
                              : status === "processing"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {status === "processing" && (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          )}
                          {status === "processed" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {status === "pending" && (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!document.processedAt && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleProcessDocument(document)}
                    disabled={isProcessing(document.id)}
                    title="Process document for RAG"
                  >
                    {isProcessing(document.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(document.fileUrl, "_blank")}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const link = window.document.createElement("a");
                    link.href = document.fileUrl;
                    link.download = document.fileName;
                    link.click();
                  }}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openDeleteDialog(document)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
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
    </Card>
  );
}
