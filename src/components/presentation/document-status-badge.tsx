import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";

interface DocumentStatusBadgeProps {
  status: "processing" | "processed" | "pending";
  label: string;
  chunkCount?: number;
  onToggleDetails?: () => void;
  hasWarning?: boolean;
}

export function DocumentStatusBadge({
  status,
  label,
  chunkCount,
  onToggleDetails,
  hasWarning,
}: DocumentStatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
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
        {status === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
        {label}
      </Badge>
      {chunkCount !== undefined && (
        <Badge
          variant="outline"
          className="text-xs"
          title={`${chunkCount} chunks in vector store`}
        >
          {chunkCount} chunks
        </Badge>
      )}
      {onToggleDetails && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1"
          onClick={onToggleDetails}
          title="View detailed status"
        >
          {hasWarning ? (
            <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          ) : (
            <Info className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}

