import { Database } from "lucide-react";

interface PresentationStatusSummary {
  total: number;
  processed: number;
  totalChunks: number;
}

interface DocumentStatusSummaryProps {
  summary: PresentationStatusSummary | null;
}

export function DocumentStatusSummary({ summary }: DocumentStatusSummaryProps) {
  if (!summary) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Database className="h-3 w-3" />
        {summary.totalChunks} chunks
      </span>
      <span>•</span>
      <span>
        {summary.processed}/{summary.total} processed
      </span>
    </div>
  );
}

