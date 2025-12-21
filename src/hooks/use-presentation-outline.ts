import { useState, useEffect, useCallback } from "react";
import { presentationOutlineSchema } from "@/schema/ppt-outline";
import type { z } from "zod";

type PresentationOutline = z.infer<typeof presentationOutlineSchema>;

interface UsePresentationOutlineResult {
  outline: PresentationOutline | null;
  userInput: string | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePresentationOutline(
  presentationId: string | null | undefined
): UsePresentationOutlineResult {
  const [outline, setOutline] = useState<PresentationOutline | null>(null);
  const [userInput, setUserInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOutline = useCallback(async () => {
    if (!presentationId) {
      setOutline(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/presentation/${presentationId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch presentation: ${response.statusText}`);
      }

      const data = await response.json();

      setUserInput(data.userInput || null);

      if (data.outline) {
        // Validate and parse the outline
        const parsed = presentationOutlineSchema.parse(data.outline);
        setOutline(parsed);
      } else {
        setOutline(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error("Error fetching outline:", error);
      setError(error);
      setOutline(null);
    } finally {
      setLoading(false);
    }
  }, [presentationId]);

  useEffect(() => {
    fetchOutline();
  }, [fetchOutline]);

  return {
    outline,
    userInput,
    loading,
    error,
    refetch: fetchOutline,
  };
}
