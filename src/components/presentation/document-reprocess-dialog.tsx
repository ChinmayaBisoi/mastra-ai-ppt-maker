"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCw, AlertTriangle, Loader2 } from "lucide-react";
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

interface DocumentReprocessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  presentationId: string;
  onSuccess?: () => void;
}

export function DocumentReprocessDialog({
  open,
  onOpenChange,
  document,
  presentationId,
  onSuccess,
}: DocumentReprocessDialogProps) {
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (isReprocessing) return; // Prevent closing while reprocessing
    onOpenChange(false);
    // Reset state when closing
    setError(null);
  };

  const handleReprocess = async () => {
    if (!document) return;

    setIsReprocessing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/presentation/${presentationId}/documents/${document.id}/reprocess`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to reprocess document";
        throw new Error(errorMessage);
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Error reprocessing document:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reprocess document";
      setError(errorMessage);
      toast.error("Failed to reprocess document", {
        description: errorMessage,
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={!isReprocessing}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Reprocess Document
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Are you sure you want to reprocess{" "}
              <span className="font-semibold">{document?.fileName}</span>?
            </p>
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 mt-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <p className="font-medium">This will:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Delete all existing chunks from the vector store</li>
                    <li>Regenerate chunks with current settings</li>
                    <li>Update the document processing timestamp</li>
                  </ul>
                  <p className="mt-2 text-xs">
                    This action may take a few moments to complete.
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isReprocessing}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleReprocess}
            disabled={isReprocessing}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isReprocessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reprocessing...
              </>
            ) : (
              <>
                <RotateCw className="mr-2 h-4 w-4" />
                Reprocess Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

