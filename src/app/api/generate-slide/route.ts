import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mastra } from "@/mastra";

const SLIDER_PROMPT = `Generate HTML (TailwindCSS + Flowbite UI + Lucide Icons)
code for a 16:9 ppt slider in Modern Dark style.
{DESIGN_STYLE}. No responsive design; use a fixed 16:9 layout for slides.
Use Flowbite component structure. Use different layouts depending on content and style.
Use TailwindCSS colors like primary, accent, gradients, background, etc., and include colors from {COLORS_CODE}.
MetaData for Slider: {METADATA}

- Ensure images are optimized to fit within their container div and do not overflow.
- Use proper width/height constraints on images so they scale down if needed to remain inside the slide.
- Maintain 16:9 aspect ratio for all slides and all media.
- Use CSS classes like 'object-cover' or 'object-contain' for images to prevent stretching or overflow.
- Use grid or flex layouts to properly divide the slide so elements do not overlap.

Generate Image if needed using:
'https://ik.imagekit.io/ikmedia/ik-genimg-prompt-{imagePrompt}/{altImageName}.jpg'
Replace {imagePrompt} with relevant image prompt and altImageName with a random image name.

<!-- Slide Content Wrapper (Fixed 16:9 Aspect Ratio) -->

<div class="w-[800px] h-[500px] relative overflow-hidden">

<!-- Slide content here -->

</div>
Also do not add any overlay : Avoid this :
    <div class="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-20"></div>

Also do not add any overlay : Avoid this :

<div class="absolute

Just provide body content for 1 slider. Make sure all content, including images, stays within the main slide div and preserves the 16:9 ratio.`;

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { slideMetadata, designStyle, colors } = body;

    if (!slideMetadata) {
      return new Response(
        JSON.stringify({ error: "slideMetadata is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const agent = mastra.getAgent("pptxSlideGeneratorAgent");
    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const designStyleText = designStyle?.designGuide || "Modern Dark style";
    const colorsCode = colors ? JSON.stringify(colors) : "{}";
    const metadataText = JSON.stringify(slideMetadata);

    const prompt = SLIDER_PROMPT.replace(
      "{DESIGN_STYLE}",
      designStyleText
    )
      .replace("{COLORS_CODE}", colorsCode)
      .replace("{METADATA}", metadataText);

    const response = await agent.stream(
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      {}
    );

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullText = "";
          for await (const chunk of response.textStream) {
            fullText += chunk;
            // Send each chunk as it arrives
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ chunk, type: "chunk" })}\n\n`
              )
            );
          }

          // Clean up the HTML code (remove markdown code blocks if present)
          const cleanedText = fullText
            .replace(/```html/g, "")
            .replace(/```/g, "")
            .trim();

          // Send the final cleaned HTML code
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                html: cleanedText,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Error generating slide:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error generating slide:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to generate slide",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
