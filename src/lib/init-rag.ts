import { initializeVectorStore } from "./vector-store";

let initialized = false;

export async function initRAG() {
  if (initialized) {
    return;
  }

  try {
    await initializeVectorStore();
    initialized = true;
    console.log("RAG system initialized");
  } catch (error) {
    console.error("Failed to initialize RAG system:", error);
    throw error;
  }
}
