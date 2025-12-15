import { z } from "zod";

// Schema for structured output
export const presentationOutlineSchema = z.object({
  slides: z.array(
    z.object({
      slideNumber: z.number().describe("The slide number (1-indexed)"),
      title: z
        .string()
        .min(3)
        .max(100)
        .describe(
          "Descriptive slide title (3-8 words, specific and actionable)"
        ),
      keyPoints: z
        .array(z.string())
        .min(2)
        .max(4)
        .describe(
          "2-4 concise bullet points covering the main content for this slide"
        ),
    })
  ),
  summary: z
    .string()
    .optional()
    .describe("Brief summary of the overall presentation theme and narrative"),
});
