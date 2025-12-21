import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { processDocumentForRAG } from "@/lib/document-processor";

export async function GET(
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

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { clerkId },
      });
    }

    // First check if presentation exists
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation) {
      console.error(`Presentation ${presentationId} does not exist`);
      return new Response(JSON.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user owns the presentation
    if (presentation.userId !== user.id) {
      console.error(
        `User ${user.id} does not own presentation ${presentationId} (owner: ${presentation.userId})`
      );
      return new Response(JSON.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const documents = await prisma.document.findMany({
      where: {
        presentationId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return new Response(JSON.stringify(documents), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to fetch documents",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

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
    console.log("POST /documents - Received body:", body);
    const { fileName, fileUrl, fileSize, fileType } = body;

    if (
      !fileName ||
      !fileUrl ||
      fileSize === undefined ||
      fileSize === null ||
      !fileType
    ) {
      console.error("Missing required fields:", {
        fileName,
        fileUrl,
        fileSize,
        fileType,
      });
      return new Response(
        JSON.stringify({
          error: "fileName, fileUrl, fileSize, and fileType are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { clerkId },
      });
    }

    // First check if presentation exists
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation) {
      console.error(`Presentation ${presentationId} does not exist`);
      return new Response(JSON.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user owns the presentation
    if (presentation.userId !== user.id) {
      console.error(
        `User ${user.id} does not own presentation ${presentationId} (owner: ${presentation.userId})`
      );
      return new Response(JSON.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Creating document with data:", {
      presentationId,
      fileName,
      fileUrl,
      fileSize,
      fileType,
    });

    const document = await prisma.document.create({
      data: {
        presentationId,
        fileName,
        fileUrl,
        fileSize: Number(fileSize),
        fileType,
      },
    });

    console.log("Document created successfully:", document.id);

    // Process document for RAG asynchronously (don't block response)
    processDocumentForRAG(
      document.id,
      fileUrl,
      fileType,
      fileName,
      presentationId
    ).catch((error) => {
      console.error(
        `Failed to process document ${document.id} for RAG:`,
        error
      );
    });

    return new Response(JSON.stringify(document), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating document:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to create document",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
