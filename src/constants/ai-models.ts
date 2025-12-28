import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Create Ollama provider instance
export const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: "ollama", // Ollama doesn't require a real key
});

const GPT_4O_MINI = "openai/gpt-4o-mini";

// FREE MODELS
const GPT_OSS_20B = "openrouter/openai/gpt-oss-20b";

// LLM Models - using Ollama locally
const LLAMA3_2_3B = ollama("llama3.2:3b");
const LLAMA3_70B = ollama("llama3:70b");
const MISTRAL_LARGE = ollama("mistral-large");
const LLAMA3_8B = ollama("llama3:8b");
const MISTRAL = ollama("mistral");

export const AI_MODELS = {
  PAID: {
    LLAMA3_70B,
    MISTRAL_LARGE,
  },
  FREE: {
    LLAMA3_2_3B,
    LLAMA3_8B,
    MISTRAL,
    GPT_OSS_20B,
  },
} as const;

// Default model for agents (using free tier)
export const DEFAULT_MODEL = AI_MODELS.FREE.LLAMA3_2_3B;
