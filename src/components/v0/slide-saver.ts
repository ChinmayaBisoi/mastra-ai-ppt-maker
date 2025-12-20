export interface Slide {
  code: string;
}

export async function saveSlidesToDatabase(
  presentationId: string,
  slides: Slide[]
): Promise<void> {
  try {
    const response = await fetch(`/api/presentations/${presentationId}/slides`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slides }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save slides");
    }
  } catch (error) {
    console.error("Error saving slides:", error);
    throw error;
  }
}

export async function updateSlideCode(
  presentationId: string,
  slideIndex: number,
  code: string,
  currentSlides: Slide[]
): Promise<void> {
  const updatedSlides = [...currentSlides];
  updatedSlides[slideIndex] = { code };
  await saveSlidesToDatabase(presentationId, updatedSlides);
}

