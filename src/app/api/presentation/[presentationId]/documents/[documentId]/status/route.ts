import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkDocumentProcessingStatus } from "@/lib/document-utils";

/**
 * GET /api/presentation/[presentationId]/documents/[documentId]/status
 * Get processing status for a specific document
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ presentationId: string; documentId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { presentationId, documentId } = await params;

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

    // Verify document belongs to presentation
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        presentationId,
      },
    });

    if (!document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get processing status
    const status = await checkDocumentProcessingStatus(documentId);

    return new Response(JSON.stringify(status), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting document status:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get document status",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
