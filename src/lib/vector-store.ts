import { PgVector } from "@mastra/pg";

export const vectorStore = new PgVector({
  connectionString: process.env.DATABASE_URL!,
});

// Initialize vector store (call once on startup)
// Note: Mastra's createIndex() is idempotent - it won't recreate an existing index
// with the same configuration, so it's safe to call multiple times
export async function initializeVectorStore() {
  try {
    await vectorStore.createIndex({
      indexName: "document_chunks",
      dimension: 768, // nomic-embed-text dimension (Ollama)
    });
    console.log("Vector store index ready");
  } catch (error: unknown) {
    // Log error but don't throw - index creation failures shouldn't break the app
    // The index might already exist or there might be a configuration issue
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error initializing vector store:", errorMessage);

    // Re-throw only if it's a critical error (not just "already exists")
    // Mastra's createIndex is idempotent, so most errors here are non-critical
    if (!errorMessage.toLowerCase().includes("already exists")) {
      throw error;
    }
  }
}
