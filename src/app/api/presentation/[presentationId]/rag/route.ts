import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { documentRAGTool } from "@/mastra/tools/document-rag-tool";
import { RuntimeContext } from "@mastra/core/di";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ presentationId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { presentationId } = await params;
    const body = await request.json();
    const { query, topK = 5 } = body;

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user owns presentation
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation || presentation.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Execute RAG search
    if (!documentRAGTool.execute) {
      return new Response(
        JSON.stringify({ error: "RAG tool execute method not available" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await documentRAGTool.execute({
      context: {
        query,
        presentationId,
        topK,
      },
      runtimeContext: new RuntimeContext(),
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("RAG query error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "RAG query failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
