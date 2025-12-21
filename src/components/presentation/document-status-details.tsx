import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, Loader2, RotateCw } from "lucide-react";

interface DocumentStatus {
  exists: boolean;
  isProcessed: boolean;
  chunkCount: number;
  status:
    | "not_processed"
    | "fully_processed"
    | "marked_processed_but_no_chunks"
    | "chunks_exist_but_not_marked";
  processedAt?: string | null;
  warning?: "low_chunk_count" | "single_chunk" | null;
}

interface DocumentStatusDetailsProps {
  status: DocumentStatus | null;
  isLoading: boolean;
  isProcessing: boolean;
  onReprocess: () => void;
}

export function DocumentStatusDetails({
  status,
  isLoading,
  isProcessing,
  onReprocess,
}: DocumentStatusDetailsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading status...
      </div>
    );
  }

  if (!status) return null;

  const hasWarning =
    status.warning === "single_chunk" || status.warning === "low_chunk_count";

  return (
    <div className="space-y-3">
      {hasWarning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              {status.warning === "single_chunk" && (
                <>
                  <div className="font-semibold text-amber-900 dark:text-amber-100">
                    Low Chunk Count Detected
                  </div>
                  <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                    Only 1 chunk found. This may indicate the document is too
                    short or text extraction had issues. RAG search will return
                    the entire document for any query, reducing search
                    granularity.
                  </p>
                </>
              )}
              {status.warning === "low_chunk_count" && (
                <>
                  <div className="font-semibold text-amber-900 dark:text-amber-100">
                    Low Chunk Count Warning
                  </div>
                  <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                    Only {status.chunkCount} chunks found. This may limit RAG
                    search granularity and accuracy.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
            <Button
              variant="default"
              size="sm"
              onClick={onReprocess}
              disabled={isProcessing}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Reprocessing...
                </>
              ) : (
                <>
                  <RotateCw className="h-3 w-3 mr-2" />
                  Reprocess Document
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="font-semibold text-sm mb-2">Status Details</div>
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground">Processing Status:</span>
          <Badge
            variant={
              status.status === "fully_processed"
                ? "default"
                : status.status === "not_processed"
                  ? "outline"
                  : "secondary"
            }
            className="text-xs"
          >
            {status.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground">
            Chunks in Vector Store:
          </span>
          <span
            className={`font-medium ${
              hasWarning ? "text-amber-600 dark:text-amber-400" : ""
            }`}
          >
            {status.chunkCount}
          </span>
        </div>
        {status.processedAt && (
          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">Processed At:</span>
            <span className="text-muted-foreground">
              {new Date(status.processedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {status.status === "marked_processed_but_no_chunks" && (
        <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Marked as processed but no chunks found in vector store
          </span>
        </div>
      )}

      {status.status === "chunks_exist_but_not_marked" && (
        <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md text-blue-800 dark:text-blue-200 flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <span>Chunks exist but document not marked as processed</span>
        </div>
      )}
    </div>
  );
}

