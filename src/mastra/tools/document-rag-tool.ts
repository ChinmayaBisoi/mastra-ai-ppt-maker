import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { vectorStore } from "@/lib/vector-store";

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

export const documentRAGTool = createTool({
  id: "document-rag-search",
  description:
    "Search through uploaded documents for a presentation to find relevant information. Use this when you need to reference content from user-uploaded documents when generating presentation outlines or slides.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The search query to find relevant document content"),
    presentationId: z
      .string()
      .describe("The presentation ID to search documents for"),
    topK: z
      .number()
      .default(5)
      .optional()
      .describe("Number of relevant chunks to retrieve (default: 5)"),
  }),
  execute: async (inputData) => {
    const query = inputData.context?.query;
    const presentationId = inputData.context?.presentationId;
    const topK = inputData.context?.topK ?? 5;

    if (!query || !presentationId) {
      return {
        results: [],
        error: "query and presentationId are required",
      };
    }

    try {
      // Generate query embedding
      const { embedding: queryEmbedding } = await embed({
        value: query,
        model: EMBEDDING_MODEL,
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
