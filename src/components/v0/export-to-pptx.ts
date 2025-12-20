import PptxGenJS from "pptxgenjs";
// Note: Requires html-to-image package
// Install with: npm install html-to-image @types/html-to-image
import * as htmlToImage from "html-to-image";

export async function exportSlidesToPPTX(
  containerRef: { current: HTMLDivElement | null },
  fileName: string = "MyProjectSlides.pptx"
): Promise<void> {
  if (!containerRef.current) {
    throw new Error("Container ref is not available");
  }

  const pptx = new PptxGenJS();
  const iframes = containerRef.current.querySelectorAll("iframe");

  for (let i = 0; i < iframes.length; i++) {
    const iframe = iframes[i] as HTMLIFrameElement;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) continue;

    // Grab the main slide element inside the iframe (usually <body> or inner div)
    const slideNode =
      iframeDoc.querySelector("body > div") || iframeDoc.body;
    if (!slideNode) continue;

    console.log(`Exporting slide ${i + 1}...`);
    
    try {
      const dataUrl = await htmlToImage.toPng(slideNode, { quality: 1 });

      const slide = pptx.addSlide();
      slide.addImage({
        data: dataUrl,
        x: 0,
        y: 0,
        w: 10,
        h: 5.625,
      });
    } catch (error) {
      console.error(`Error exporting slide ${i + 1}:`, error);
      // Continue with next slide even if one fails
    }
  }

  await pptx.writeFile({ fileName });
}

