import { prisma } from "./prisma";
import { vectorStore } from "./vector-store";

export interface DocumentProcessingStatus {
  exists: boolean;
  fileName?: string;
  uploadedAt?: Date;
  processedAt?: Date | null;
  isProcessed: boolean;
  chunkCount: number;
  status:
    | "not_processed"
    | "fully_processed"
    | "marked_processed_but_no_chunks"
    | "chunks_exist_but_not_marked";
  warning?: "low_chunk_count" | "single_chunk" | null;
}

/**
 * Check the processing status of a document
 * @param documentId - The ID of the document to check
 * @returns Document processing status including database and vector store checks
 */
export async function checkDocumentProcessingStatus(
  documentId: string
): Promise<DocumentProcessingStatus> {
  // Check database
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      fileName: true,
      processedAt: true,
      uploadedAt: true,
    },
  });

  if (!document) {
    return {
      exists: false,
      isProcessed: false,
      chunkCount: 0,
      status: "not_processed",
    };
  }

  // Check vector store for chunks
  let chunkCount = 0;
  try {
    // Use a dummy query vector to check for existence of chunks
    // We just need to see if any chunks exist, not to find similar ones
    const dummyVector = new Array(768).fill(0);

    const results = await vectorStore.query({
      indexName: "document_chunks",
      queryVector: dummyVector,
      topK: 1000, // Get all chunks for this document
      filter: {
        documentId: { $eq: documentId },
      },
    });
    chunkCount = results.length;
  } catch (error) {
    console.error("Error checking vector store:", error);
    // If vector store check fails, we'll still return the database status
  }

  // Determine status
  const isProcessedInDb = !!document.processedAt;
  const hasChunks = chunkCount > 0;

  let status: DocumentProcessingStatus["status"];
  if (!isProcessedInDb && !hasChunks) {
    status = "not_processed";
  } else if (isProcessedInDb && hasChunks) {
    status = "fully_processed";
  } else if (isProcessedInDb && !hasChunks) {
    status = "marked_processed_but_no_chunks";
  } else {
    status = "chunks_exist_but_not_marked";
  }

  // Determine if there are warnings
  let warning: DocumentProcessingStatus["warning"] = null;
  if (chunkCount === 1) {
    warning = "single_chunk";
  } else if (chunkCount > 0 && chunkCount < 3) {
    warning = "low_chunk_count";
  }

  return {
    exists: true,
    fileName: document.fileName,
    uploadedAt: document.uploadedAt,
    processedAt: document.processedAt,
    isProcessed: isProcessedInDb && hasChunks,
    chunkCount,
    status,
    warning,
  };
}

/**
 * Check processing status for all documents in a presentation
 * @param presentationId - The ID of the presentation
 * @returns Array of document processing statuses
 */
export async function checkPresentationDocumentsStatus(
  presentationId: string
): Promise<(DocumentProcessingStatus & { documentId: string })[]> {
  const documents = await prisma.document.findMany({
    where: { presentationId },
    select: {
      id: true,
      fileName: true,
      processedAt: true,
      uploadedAt: true,
    },
  });

  const statuses = await Promise.all(
    documents.map(async (doc) => {
      const status = await checkDocumentProcessingStatus(doc.id);
      return { ...status, documentId: doc.id };
    })
  );

  return statuses;
}

/**
 * Get a summary of document processing status for a presentation
 * @param presentationId - The ID of the presentation
 * @returns Summary statistics
 */
export async function getDocumentProcessingSummary(
  presentationId: string
): Promise<{
  total: number;
  processed: number;
  notProcessed: number;
  totalChunks: number;
  documents: (DocumentProcessingStatus & { documentId: string })[];
}> {
  const documents = await checkPresentationDocumentsStatus(presentationId);

  const processed = documents.filter(
    (d) => d.status === "fully_processed"
  ).length;
  const notProcessed = documents.filter(
    (d) => d.status === "not_processed"
  ).length;
  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);

  return {
    total: documents.length,
    processed,
    notProcessed,
    totalChunks,
    documents,
  };
}
