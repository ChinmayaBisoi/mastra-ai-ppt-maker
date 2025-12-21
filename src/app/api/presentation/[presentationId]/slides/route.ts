import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
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
    const { slides } = body;

    if (!slides || !Array.isArray(slides)) {
      return new Response(
        JSON.stringify({ error: "slides array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify user owns this presentation
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
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

    // Update slides
    const updated = await prisma.presentation.update({
      where: { id: presentationId },
      data: {
        slides: slides as any,
      },
    });

    return new Response(JSON.stringify({ success: true, slides: updated.slides }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving slides:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to save slides",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

