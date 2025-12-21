import { FileText } from "lucide-react";
import { DocumentStatusBadge } from "./document-status-badge";
import { DocumentStatusDetails } from "./document-status-details";
import { DocumentActions } from "./document-actions";

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

interface DocumentListItemProps {
  document: Document;
  status: DocumentStatus | undefined;
  isExpanded: boolean;
  isProcessing: boolean;
  isReprocessing: boolean;
  onToggleDetails: () => void;
  onProcess: () => void;
  onReprocess: () => void;
  onDelete: () => void;
  onFetchStatus?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  if (fileType.includes("word") || fileType.includes("document")) {
    return <FileText className="h-5 w-5 text-blue-600" />;
  }
  return <FileText className="h-5 w-5 text-gray-600" />;
}

function getProcessingStatus(
  document: Document,
  isProcessing: boolean
): "processing" | "processed" | "pending" {
  if (isProcessing) return "processing";
  if (document.processedAt) return "processed";
  return "pending";
}

export function DocumentListItem({
  document,
  status,
  isExpanded,
  isProcessing,
  isReprocessing,
  onToggleDetails,
  onProcess,
  onReprocess,
  onDelete,
  onFetchStatus,
}: DocumentListItemProps) {
  const processingStatus = getProcessingStatus(document, isProcessing);
  const hasWarning =
    status?.warning === "single_chunk" ||
    status?.warning === "low_chunk_count";

  const handleOpen = () => window.open(document.fileUrl, "_blank");

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getFileIcon(document.fileType)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{document.fileName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(document.fileSize)}</span>
              <span>•</span>
              <span>
                {new Date(document.uploadedAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <DocumentStatusBadge
                status={processingStatus}
                label={
                  processingStatus === "processing"
                    ? "Processing..."
                    : processingStatus === "processed"
                      ? "Processed"
                      : "Not Processed"
                }
                chunkCount={status?.chunkCount}
                onToggleDetails={onToggleDetails}
                hasWarning={hasWarning}
              />
            </div>
          </div>
        </div>
        <DocumentActions
          isProcessed={!!document.processedAt}
          isProcessing={isProcessing}
          isReprocessing={isReprocessing}
          onProcess={onProcess}
          onReprocess={onReprocess}
          onOpen={handleOpen}
          onDownload={handleDownload}
          onDelete={onDelete}
        />
      </div>
      {isExpanded && (
        <div className="p-2 bg-muted rounded-md text-xs">
          <DocumentStatusDetails
            status={status || null}
            isLoading={!status && !!onFetchStatus}
            isProcessing={isProcessing || isReprocessing}
            onReprocess={onReprocess}
          />
        </div>
      )}
    </div>
  );
}

