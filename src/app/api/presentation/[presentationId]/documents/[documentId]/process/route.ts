import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { processDocumentForRAG } from "@/lib/document-processor";

export async function POST(
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

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { clerkId },
      });
    }

    // Verify presentation ownership
    const presentation = await prisma.presentation.findFirst({
      where: {
        id: presentationId,
        userId: user.id,
      },
    });

    if (!presentation) {
      return new Response(JSON.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get document
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

    // Process document for RAG
    try {
      await processDocumentForRAG(
        document.id,
        document.fileUrl,
        document.fileType,
        document.fileName,
        presentationId
      );

      // Fetch updated document
      const updatedDocument = await prisma.document.findUnique({
        where: { id: documentId },
      });

      return new Response(
        JSON.stringify({
          success: true,
          document: updatedDocument,
          message: "Document processed successfully",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error processing document:", error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Failed to process document",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in process endpoint:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to process document",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
