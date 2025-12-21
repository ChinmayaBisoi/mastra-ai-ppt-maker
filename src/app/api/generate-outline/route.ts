import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mastra } from "@/mastra";
import { presentationOutlineSchema } from "@/schema/ppt-outline";
import { prisma } from "@/lib/prisma";

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
    const { description, slideCount, presentationId } = body;

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

    // Build prompt with optional RAG context
    const slideCountNum =
      typeof slideCount === "string"
        ? parseInt(slideCount, 10)
        : Number(slideCount);
    let prompt = `Generate a presentation outline with exactly ${slideCountNum} slides based on the following description:

${description}`;

    // If presentationId exists, instruct agent to use RAG tool
    if (presentationId) {
      prompt += `\n\nCRITICAL: This presentation has ID "${presentationId}". 

BEFORE generating the outline, you MUST:
1. Use the documentRAGTool to search for relevant information from uploaded documents
2. Search with meaningful queries related to the presentation topic (e.g., search for key terms from the description)
3. Always provide a non-empty query string and the presentationId: "${presentationId}"
4. Use the retrieved document content to enhance and inform your outline generation
5. Incorporate specific facts, data, statistics, or insights from the documents into your slide titles and key points

Example tool usage:
- Query: "sales performance metrics" (if description mentions sales)
- Query: "marketing strategies" (if description mentions marketing)
- Query: "quarterly results" (if description mentions quarterly review)

The documentRAGTool will return relevant chunks from uploaded documents. Use this information to make your outline more accurate, detailed, and data-driven.`;
    }

    prompt += `\n\nPlease create a structured outline with exactly ${slideCountNum} slides. Each slide should have:
- A descriptive title (3-8 words, specific and actionable)
- 2-5 key points covering the main content 

CRITICAL: You MUST return ONLY a valid JSON object. No markdown, no code blocks, no explanations. Just pure JSON.

Required JSON structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide title here",
      "keyPoints": ["Point 1", "Point 2", "Point 3"]
    },
    {
      "slideNumber": 2,
      "title": "Another slide title",
      "keyPoints": ["Point 1", "Point 2"]
    }
  ],
  "summary": "Brief summary of the presentation"
}

IMPORTANT: 
- Return exactly ${slideCountNum} slides in the slides array
- Each slide must have slideNumber, title, and keyPoints
- Return ONLY the JSON, nothing else before or after`;

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
            // Clean the text - remove markdown code blocks if present
            let cleanedText = fullText.trim();

            // Remove markdown code blocks
            cleanedText = cleanedText
              .replace(/```json\s*/g, "")
              .replace(/```\s*/g, "");
            cleanedText = cleanedText.trim();

            // Try to extract JSON from the response - look for JSON object
            let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

            // If no match, try to find JSON array (though we expect object)
            if (!jsonMatch) {
              jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
            }

            if (jsonMatch) {
              let parsed;
              try {
                parsed = JSON.parse(jsonMatch[0]);
              } catch (parseError) {
                console.error("JSON parse error:", parseError);
                // Try to fix common JSON issues
                const fixedJson = jsonMatch[0]
                  .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
                  .replace(/([{,]\s*)(\w+)(\s*):/g, '$1"$2":'); // Add quotes to keys
                try {
                  parsed = JSON.parse(fixedJson);
                } catch {
                  throw new Error("Failed to parse JSON even after fixing");
                }
              }

              // Validate the parsed JSON
              if (!parsed || typeof parsed !== "object") {
                throw new Error("Parsed JSON is not an object");
              }

              // Ensure slides array exists and is not empty
              if (!parsed.slides || !Array.isArray(parsed.slides)) {
                throw new Error("Missing or invalid slides array in response");
              }

              if (parsed.slides.length === 0) {
                throw new Error(
                  "Slides array is empty - model did not generate any slides"
                );
              }

              // Validate that we have the expected number of slides
              if (parsed.slides.length !== slideCountNum) {
                console.warn(
                  `Expected ${slideCountNum} slides but got ${parsed.slides.length}. Proceeding with ${parsed.slides.length} slides.`
                );
              }

              // Validate each slide has required fields
              for (let i = 0; i < parsed.slides.length; i++) {
                const slide = parsed.slides[i];
                if (
                  !slide.slideNumber ||
                  !slide.title ||
                  !slide.keyPoints ||
                  !Array.isArray(slide.keyPoints)
                ) {
                  throw new Error(
                    `Slide ${i + 1} is missing required fields (slideNumber, title, or keyPoints)`
                  );
                }
                if (slide.keyPoints.length === 0) {
                  throw new Error(`Slide ${i + 1} has no key points`);
                }
              }

              const validated = presentationOutlineSchema.parse(parsed);

              // Find or create User
              let user = await prisma.user.findUnique({
                where: { clerkId },
              });

              if (!user) {
                user = await prisma.user.create({
                  data: { clerkId },
                });
              }

              // Final validation: Ensure we never save empty slides array
              if (!validated.slides || validated.slides.length === 0) {
                throw new Error(
                  "Cannot save outline: slides array is empty after validation"
                );
              }

              // Create or update Presentation with outline
              // Convert to JSON-serializable format for Prisma Json field
              const outlineData = JSON.parse(JSON.stringify(validated));

              const presentation = presentationId
                ? await prisma.presentation.update({
                    where: { id: presentationId },
                    data: {
                      outline: outlineData,
                      userInput: description,
                    },
                  })
                : await prisma.presentation.create({
                    data: {
                      userId: user.id,
                      userInput: description,
                      outline: outlineData,
                    },
                  });

              // Send the final validated outline with presentationId
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "complete",
                    outline: validated,
                    presentationId: presentation.id,
                  })}\n\n`
                )
              );
            } else {
              // If no JSON found, log error and send error message
              console.error(
                "No JSON found in response. Full text:",
                fullText.substring(0, 500)
              );
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    error:
                      "Failed to generate valid outline. The model did not return valid JSON.",
                    text: fullText.substring(0, 1000),
                  })}\n\n`
                )
              );
            }
          } catch (error) {
            console.error("Error saving outline:", error);
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            // If parsing fails, send error with raw text for debugging
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: `Validation failed: ${errorMessage}`,
                  text: fullText.substring(0, 1000),
                })}\n\n`
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
