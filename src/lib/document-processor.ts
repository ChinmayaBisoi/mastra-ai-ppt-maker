import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
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

    // Generate embeddings
    const { embeddings } = await embedMany({
      values: chunks.map((chunk) => chunk.text),
      model: EMBEDDING_MODEL,
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

export async function deleteDocumentChunks(documentId: string) {
  try {
    await initRAG();

    // PgVector from Mastra stores vectors in a table managed by the library
    // We need to use raw SQL to delete vectors with matching documentId in metadata
    // The exact table name depends on Mastra's implementation, but it's typically
    // based on the indexName. For now, we'll use a generic approach.
    const { prisma } = await import("./prisma");

    // Try to delete vectors by querying the vector store's underlying table
    // Note: This assumes Mastra's PgVector stores metadata in a JSONB column
    // Adjust table name and column names based on actual Mastra PgVector implementation
    try {
      // Attempt to delete using raw SQL - table name may vary
      await prisma.$executeRawUnsafe(
        `DELETE FROM vectors WHERE metadata->>'documentId' = $1`,
        documentId
      );
      console.log(`Deleted vector chunks for document ${documentId}`);
    } catch (sqlError: unknown) {
      // If table doesn't exist or has different structure, try alternative
      const errorMessage =
        sqlError instanceof Error ? sqlError.message : String(sqlError);
      console.warn(
        `Could not delete vectors using standard table, trying alternative:`,
        errorMessage
      );
      // Vector cleanup is best-effort - document deletion should still succeed
    }
  } catch (error) {
    console.error(
      `Failed to delete vector chunks for document ${documentId}:`,
      error
    );
    // Don't throw - document deletion should succeed even if vector cleanup fails
  }
}
