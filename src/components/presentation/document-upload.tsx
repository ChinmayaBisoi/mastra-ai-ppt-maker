"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";
// UploadButton returns an array of file objects
type UploadFileResponse = {
  name: string;
  url: string;
  size: number;
  type?: string; // Optional file type
};

interface DocumentUploadProps {
  presentationId: string;
  onUploadComplete: (document: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }) => void;
}

export function DocumentUpload({
  presentationId,
  onUploadComplete,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadComplete = async (res: UploadFileResponse[]) => {
    if (!res || res.length === 0) {
      toast.error("Upload failed");
      setIsUploading(false);
      return;
    }

    console.log(`Upload complete - processing ${res.length} file(s):`, res);

    // Validate file extensions
    const allowedExtensions = [".docx", ".txt"];
    const invalidFiles: string[] = [];
    const validFiles: UploadFileResponse[] = [];

    res.forEach((file) => {
      const extension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));
      if (!allowedExtensions.includes(extension)) {
        invalidFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(
        `Invalid file types: ${invalidFiles.join(", ")}. Only .docx and .txt files are allowed.`
      );
      // Continue processing valid files even if some are invalid
      if (validFiles.length === 0) {
        setIsUploading(false);
        return;
      }
    }

    // Process all valid files
    const results: Array<{
      success: boolean;
      fileName: string;
      error?: string;
    }> = [];

    for (const file of validFiles) {
      try {
        // Prepare document data - handle missing properties
        const documentData = {
          fileName: file.name,
          fileUrl: file.url,
          fileSize: file.size ?? 0, // UploadThing might not provide size
          fileType: file.type || "application/octet-stream",
        };

        console.log("Sending document data to API:", documentData);

        // Save document to database
        const response = await fetch(
          `/api/presentation/${presentationId}/documents`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(documentData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            `Failed to save document: ${response.status} ${response.statusText}`;
          console.error(`API error for ${file.name}:`, errorMessage, errorData);
          results.push({
            success: false,
            fileName: file.name,
            error: errorMessage,
          });
          continue;
        }

        const document = await response.json();
        console.log(`Document created successfully: ${file.name}`, document);
        results.push({ success: true, fileName: file.name });
        onUploadComplete(document);
      } catch (error) {
        console.error(`Error saving document ${file.name}:`, error);
        results.push({
          success: false,
          fileName: file.name,
          error:
            error instanceof Error ? error.message : "Failed to save document",
        });
      }
    }

    // Show error toast if any files failed
    const failedFiles = results.filter((r) => !r.success);
    if (failedFiles.length > 0) {
      const errorMessages = failedFiles.map(
        (f) => `${f.fileName}: ${f.error || "Unknown error"}`
      );
      toast.error(
        `Failed to save ${failedFiles.length} file(s): ${errorMessages.join("; ")}`
      );
    }

    setIsUploading(false);
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    toast.error(error.message || "Upload failed");
    setIsUploading(false);
  };

  return (
    <div className="w-fit ml-auto">
      <UploadButton
        endpoint="documentUploader"
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onUploadBegin={() => {
          setIsUploading(true);
        }}
        className="items-end"
        content={{
          button: ({ ready }) => (
            <>
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : ready ? "Upload" : "..."}
            </>
          ),
        }}
        appearance={{
          button: cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "ut-ready:bg-primary ut-ready:text-primary-foreground ut-uploading:cursor-not-allowed ut-uploading:opacity-50 h-8 px-3 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2"
          ),
        }}
      />
    </div>
  );
}
