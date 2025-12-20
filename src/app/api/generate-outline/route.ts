import { NextRequest } from "next/server";
import { mastra } from "@/mastra";
import { presentationOutlineSchema } from "@/schema/ppt-outline";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, slideCount } = body;

    if (!description || !slideCount) {
      return new Response(
        JSON.stringify({ error: "Description and slideCount are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const agent = mastra.getAgent("pptxOutlineGeneratorAgent");
    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `Generate a presentation outline with exactly ${slideCount} slides based on the following description:

${description}

Please create a structured outline with ${slideCount} slides. Each slide should have:
- A descriptive title (3-8 words, specific and actionable)
- 2-5 key points covering the main content 

IMPORTANT: Return the outline as a valid JSON object matching this structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide title here",
      "keyPoints": ["Point 1", "Point 2", "Point 3"]
    }
  ],
  "summary": "Optional summary of the presentation"
}

Return ONLY the JSON object, no additional text before or after.`;

    const response = await agent.stream(
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        structuredOutput: {
          schema: presentationOutlineSchema,
          jsonPromptInjection: true, // for models that dont support structured output
        },
      }
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

          // After streaming completes, parse and validate the outline
          try {
            // Try to extract JSON from the response
            const jsonMatch = fullText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const validated = presentationOutlineSchema.parse(parsed);

              // Send the final validated outline
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "complete", outline: validated })}\n\n`
                )
              );
            } else {
              // If no JSON found, send the raw text
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "complete", text: fullText })}\n\n`
                )
              );
            }
          } catch {
            // If parsing fails, send the raw text
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "complete", text: fullText })}\n\n`
              )
            );
          }

          controller.close();
        } catch (error) {
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
    console.error("Error generating outline:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to generate outline",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
