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
    <div className="flex items-center gap-2.5 text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        <span className="font-medium">{summary.totalChunks}</span>
        <span className="text-muted-foreground/80">chunks</span>
      </span>
      <span className="text-muted-foreground/40">•</span>
      <span className="text-muted-foreground">
        <span className="font-medium text-foreground">{summary.processed}</span>
        <span className="text-muted-foreground/80">/{summary.total}</span>{" "}
        processed
      </span>
    </div>
  );
}

