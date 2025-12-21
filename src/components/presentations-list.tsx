"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight } from "lucide-react";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

interface Presentation {
  id: string;
  userInput: string;
  createdAt: string;
  updatedAt: string;
  slides: any[] | null;
  outline: any | null;
}

export function PresentationsList() {
  const router = useRouter();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPresentations() {
      try {
        const response = await fetch("/api/presentation");
        if (!response.ok) {
          throw new Error("Failed to fetch presentations");
        }
        const data = await response.json();
        setPresentations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPresentations();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-48 rounded-2xl bg-muted/40 animate-pulse border border-border/50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="rounded-full bg-muted/50 p-6 mb-6">
          <Sparkles className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No presentations yet</h3>
        <p className="text-muted-foreground text-center mb-8 max-w-sm text-sm">
          Create your first presentation to get started
        </p>
        <Button asChild variant="default">
          <Link href="/create">Create Presentation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {presentations.map((presentation) => {
        const slideCount = Array.isArray(presentation.slides)
          ? presentation.slides.length
          : 0;
        const updatedAt = new Date(presentation.updatedAt);

        return (
          <div
            key={presentation.id}
            className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 cursor-pointer transition-all duration-300 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-black/5"
            onClick={() => router.push(`/create/${presentation.id}`)}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 mb-4">
                <h3 className="text-base font-medium leading-snug mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {presentation.userInput || "Untitled Presentation"}
                </h3>
                {slideCount > 0 && (
                  <div className="inline-flex items-center text-xs text-muted-foreground">
                    {slideCount} {slideCount === 1 ? "slide" : "slides"}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(updatedAt)}
                </span>
                <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
