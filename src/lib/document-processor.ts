import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import type { EmbeddingModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import mammoth from "mammoth";
import { vectorStore } from "./vector-store";
import { initRAG } from "./init-rag";
import { prisma } from "./prisma";

// Create Ollama provider for embeddings
const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: "ollama",
});

// Using nomic-embed-text (768 dimensions) - alternative: "all-minilm" (384 dimensions)
const EMBEDDING_MODEL = ollama.textEmbeddingModel("nomic-embed-text");

export async function extractTextFromDocument(
  fileUrl: string,
  fileType: string
): Promise<string> {
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();

  if (fileType.includes("word") || fileType.includes("document")) {
    // Convert ArrayBuffer to Buffer for mammoth (mammoth expects Buffer, not ArrayBuffer)
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (fileType.includes("text") || fileType.includes("plain")) {
    return new TextDecoder().decode(arrayBuffer);
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

export async function processDocumentForRAG(
  documentId: string,
  fileUrl: string,
  fileType: string,
  fileName: string,
  presentationId: string
) {
  try {
    // Ensure vector store is initialized
    await initRAG();

    // Extract text
    const text = await extractTextFromDocument(fileUrl, fileType);

    if (!text || text.trim().length === 0) {
      console.warn(`Document ${documentId} has no extractable text`);
      return;
    }

    // Create MDocument and chunk
    const doc = MDocument.fromText(text, {
      metadata: {
        documentId,
        fileName,
        presentationId,
      },
    });

    const chunks = await doc.chunk({
      strategy: "recursive",
      size: 512,
      overlap: 50,
      separators: ["\n"],
    });

    if (chunks.length === 0) {
      console.warn(`No chunks created for document ${documentId}`);
      return;
    }

    // Warn if document has very few chunks - might indicate issues
    if (chunks.length === 1) {
      console.warn(
        `Document ${documentId} (${fileName}) has only 1 chunk. This may indicate:
        - Document is very short (< 512 characters)
        - Text extraction may have issues
        - RAG search will be less granular (entire document returned for any query)
        Consider reviewing the document content.`
      );
    } else if (chunks.length < 3) {
      console.warn(
        `Document ${documentId} (${fileName}) has only ${chunks.length} chunks. 
        This may limit RAG search granularity.`
      );
    }

    // Generate embeddings
    // Type assertion needed due to EmbeddingModelV3 vs EmbeddingModel compatibility
    const { embeddings } = await embedMany({
      values: chunks.map((chunk) => chunk.text),
      model: EMBEDDING_MODEL as unknown as EmbeddingModel<string>,
    });

    // Store in vector store with metadata (includes chunk text)
    await vectorStore.upsert({
      indexName: "document_chunks",
      vectors: embeddings,
      metadata: chunks.map((chunk, index) => ({
        documentId,
        presentationId,
        fileName,
        chunkIndex: index,
        text: chunk.text, // Store text in metadata
      })),
    });

    // Update document with processed timestamp
    await prisma.document.update({
      where: { id: documentId },
      data: { processedAt: new Date() },
    });

    console.log(
      `Processed ${chunks.length} chunks for document ${documentId} (${fileName})`
    );
  } catch (error) {
    console.error(`Failed to process document ${documentId} for RAG:`, error);
    throw error;
  }
}

export async function deleteDocumentChunks(
  documentId: string,
  throwOnError = false // New parameter: throw errors during reprocessing
) {
  try {
    await initRAG();

    // PgVector from Mastra stores vectors in a table named after the indexName
    // Confirmed table name: "document_chunks" (matches indexName)
    const { prisma } = await import("./prisma");
    try {
      // Delete from the document_chunks table (confirmed table name)
      const result = await prisma.$executeRawUnsafe(
        `DELETE FROM "document_chunks" WHERE metadata->>'documentId' = $1`,
        documentId
      );

      console.log(`Deleted ${result} vector chunks for document ${documentId}`);

      // Verify deletion worked by checking chunk count
      const checkResults = await vectorStore.query({
        indexName: "document_chunks",
        queryVector: new Array(768).fill(0), // Dummy vector for existence check
        topK: 1000, // Get all chunks to verify
        filter: {
          documentId: { $eq: documentId },
        },
      });

      if (checkResults.length > 0) {
        const errorMsg = `Deletion reported success but ${checkResults.length} chunks still exist for document ${documentId}`;
        console.error(errorMsg);

        if (throwOnError) {
          throw new Error(errorMsg);
        }
      } else {
        console.log(`Verified: All chunks deleted for document ${documentId}`);
      }
    } catch (sqlError: unknown) {
      const errorMessage =
        sqlError instanceof Error ? sqlError.message : String(sqlError);
      console.error(
        `Error deleting chunks from document_chunks table:`,
        errorMessage
      );

      if (throwOnError) {
        throw sqlError instanceof Error
          ? sqlError
          : new Error(String(sqlError));
      }
    }
  } catch (error) {
    console.error(
      `Failed to delete vector chunks for document ${documentId}:`,
      error
    );

    if (throwOnError) {
      throw error;
    }
  }
}

/**
 * Reprocess a document: delete existing chunks and regenerate them
 * Useful when chunking issues are detected (e.g., only 1 chunk, incorrect chunks)
 */
export async function reprocessDocumentForRAG(
  documentId: string,
  fileUrl: string,
  fileType: string,
  fileName: string,
  presentationId: string
) {
  try {
    console.log(`Reprocessing document ${documentId} (${fileName})...`);

    // First, delete existing chunks - THROW on error during reprocessing
    await deleteDocumentChunks(documentId, true); // Pass true to throw on error
    console.log(`Deleted existing chunks for document ${documentId}`);

    // Reset processedAt timestamp to null before reprocessing
    await prisma.document.update({
      where: { id: documentId },
      data: { processedAt: null },
    });

    // Now process the document again
    await processDocumentForRAG(
      documentId,
      fileUrl,
      fileType,
      fileName,
      presentationId
    );

    console.log(
      `Successfully reprocessed document ${documentId} (${fileName})`
    );
  } catch (error) {
    console.error(`Failed to reprocess document ${documentId} for RAG:`, error);
    throw error;
  }
}
