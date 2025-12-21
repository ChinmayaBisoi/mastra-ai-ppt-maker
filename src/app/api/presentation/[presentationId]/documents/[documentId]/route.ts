import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { deleteDocumentChunks } from "@/lib/document-processor";

export async function DELETE(
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

    await prisma.document.delete({
      where: {
        id: documentId,
        presentationId,
      },
    });

    // Clean up vector store chunks for this document
    // Note: We don't throw on error here - document deletion succeeds even if cleanup fails
    // This ensures the document is removed from the database even if vector cleanup has issues
    try {
      await deleteDocumentChunks(documentId, false); // false = don't throw on error
      console.log(`Successfully cleaned up vector chunks for document ${documentId}`);
    } catch (error) {
      // Log error but don't fail the deletion - best effort cleanup
      console.error(
        `Failed to cleanup vector chunks for document ${documentId}:`,
        error
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to delete document",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
