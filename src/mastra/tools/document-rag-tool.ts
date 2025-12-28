import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { embed } from "ai";
import type { EmbeddingModel } from "ai";
import { vectorStore } from "@/lib/vector-store";
import { ollama } from "@/constants/ai-models";

// Using nomic-embed-text (768 dimensions) - must match document-processor.ts
const EMBEDDING_MODEL = ollama.textEmbeddingModel("nomic-embed-text");

export const documentRAGTool = createTool({
  id: "document-rag-search",
  description:
    "Search through uploaded documents for a presentation to find relevant information. Use this when you need to reference content from user-uploaded documents when generating presentation outlines or slides.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1, "Query cannot be empty")
      .describe("The search query to find relevant document content"),
    presentationId: z
      .string()
      .min(1, "Presentation ID is required")
      .describe("The presentation ID to search documents for"),
    topK: z
      .union([z.number().int().min(1).max(20), z.string()])
      .transform((val) => {
        // Handle both number and string inputs (LLMs sometimes send strings)
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        if (isNaN(num) || num < 1) return 5;
        if (num > 20) return 20;
        return num;
      })
      .default(5)
      .describe("Number of relevant chunks to retrieve (default: 5, max: 20)"),
  }),
  execute: async (inputData) => {
    const query = inputData.context?.query;
    const presentationId = inputData.context?.presentationId;
    // Handle both number and string for topK (LLMs sometimes send strings)
    let topK = inputData.context?.topK ?? 5;
    if (typeof topK === "string") {
      topK = parseInt(topK, 10);
      if (isNaN(topK) || topK < 1) topK = 5;
      if (topK > 20) topK = 20;
    }

    if (!query || !presentationId) {
      return {
        results: [],
        error: "query and presentationId are required",
      };
    }

    try {
      // Generate query embedding
      // Type assertion needed due to EmbeddingModelV3 vs EmbeddingModel compatibility
      const { embedding: queryEmbedding } = await embed({
        value: query,
        model: EMBEDDING_MODEL as unknown as EmbeddingModel<string>,
      });

      // Query vector store - filter by presentationId to ensure only results
      // for this specific presentation are returned
      const results = await vectorStore.query({
        indexName: "document_chunks", // Name of the vector index/collection
        queryVector: queryEmbedding,
        topK,
        filter: {
          presentationId: { $eq: presentationId }, // Filter by presentation ID
        },
      });

      if (results.length === 0) {
        return {
          results: [],
          message: "No relevant document content found for this query",
          query,
        };
      }

      // Results already contain text and metadata
      return {
        results: results.map((r) => ({
          text: r.metadata?.text || "",
          fileName: r.metadata?.fileName || "Unknown",
          score: r.score || 0,
          documentId: r.metadata?.documentId,
          chunkIndex: r.metadata?.chunkIndex,
        })),
        query,
        count: results.length,
      };
    } catch (error) {
      console.error("RAG search error:", error);
      return {
        results: [],
        error: error instanceof Error ? error.message : "Search failed",
        query,
      };
    }
  },
});
