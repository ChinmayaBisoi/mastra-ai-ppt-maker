import PptxGenJS from "pptxgenjs";
import type {
  Slide,
  TextElement,
  LineElement,
  ShapeElement,
} from "@/types/slide";

export async function generatePptxFromSlides(slides: Slide[]): Promise<Blob> {
  const pptx = new PptxGenJS();

  for (const slide of slides) {
    const slideObj = pptx.addSlide();

    // Set slide background
    if (slide.background.color) {
      slideObj.background = { color: slide.background.color };
    }

    // Add elements to slide
    for (const element of slide.elements) {
      if (element.type === "text") {
        const textElement = element as TextElement;
        const content = Array.isArray(textElement.content)
          ? textElement.content.join("\n")
          : textElement.content;

        slideObj.addText(content, {
          x: textElement.position.x,
          y: textElement.position.y,
          w:
            typeof textElement.position.width === "string" &&
            textElement.position.width.endsWith("%")
              ? (parseFloat(textElement.position.width) / 100) * 10 // Convert % to inches (assuming 10" width)
              : typeof textElement.position.width === "number"
                ? textElement.position.width
                : parseFloat(textElement.position.width),
          h: textElement.position.height
            ? typeof textElement.position.height === "number"
              ? textElement.position.height
              : parseFloat(textElement.position.height)
            : undefined,
          fontSize: textElement.style.fontSize || 16,
          bold:
            textElement.style.fontWeight === "bold" ||
            (typeof textElement.style.fontWeight === "number" &&
              textElement.style.fontWeight >= 600),
          fontFace: textElement.style.fontFamily || "Arial",
          color: textElement.style.color || "#000000",
          align: textElement.style.align || "left",
          lineSpacing: textElement.style.lineHeight
            ? textElement.style.lineHeight / (textElement.style.fontSize || 16)
            : undefined,
        });
      } else if (element.type === "line") {
        const lineElement = element as LineElement;
        const width =
          typeof lineElement.position.width === "number"
            ? lineElement.position.width
            : parseFloat(lineElement.position.width);

        slideObj.addShape(pptx.ShapeType.line, {
          x: lineElement.position.x,
          y: lineElement.position.y,
          w: width,
          h: 0,
          line: {
            color: lineElement.style.strokeColor || "#000000",
            width: lineElement.style.strokeWidth || 1,
          },
        });
      } else if (element.type === "shape") {
        const shapeElement = element as ShapeElement;
        const width =
          typeof shapeElement.position.width === "number"
            ? shapeElement.position.width
            : parseFloat(shapeElement.position.width);
        const height = shapeElement.position.height
          ? typeof shapeElement.position.height === "number"
            ? shapeElement.position.height
            : parseFloat(shapeElement.position.height)
          : width;

        let shapeType: PptxGenJS.ShapeType;
        switch (shapeElement.shape) {
          case "circle":
            shapeType = pptx.ShapeType.ellipse;
            break;
          case "ellipse":
            shapeType = pptx.ShapeType.ellipse;
            break;
          default:
            shapeType = pptx.ShapeType.rect;
        }

        slideObj.addShape(shapeType, {
          x: shapeElement.position.x,
          y: shapeElement.position.y,
          w: width,
          h: height,
          fill: { color: shapeElement.style.fillColor || "transparent" },
          line: {
            color: shapeElement.style.strokeColor || "transparent",
            width: shapeElement.style.strokeWidth || 0,
          },
        });
      }
    }
  }

  // Generate and return blob
  const result = await pptx.write({ outputType: "blob" });
  if (result instanceof Blob) {
    return result;
  }
  // Fallback: convert to blob if needed
  return new Blob([result as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}
