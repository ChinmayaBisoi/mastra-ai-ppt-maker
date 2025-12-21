import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  RefreshCw,
  RotateCw,
  Trash2,
  Loader2,
} from "lucide-react";

interface DocumentActionsProps {
  isProcessed: boolean;
  isProcessing: boolean;
  isReprocessing: boolean;
  onProcess: () => void;
  onReprocess: () => void;
  onOpen: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function DocumentActions({
  isProcessed,
  isProcessing,
  isReprocessing,
  onProcess,
  onReprocess,
  onOpen,
  onDownload,
  onDelete,
}: DocumentActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {!isProcessed ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onProcess}
          disabled={isProcessing}
          title="Process document for RAG"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={onReprocess}
          disabled={isProcessing}
          title="Reprocess document (delete and regenerate chunks)"
        >
          {isReprocessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="h-4 w-4" />
          )}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpen}
        title="Open in new tab"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDownload}
        title="Download"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

