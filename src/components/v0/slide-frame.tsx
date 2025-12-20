import React, { useEffect, useRef, useState } from "react";

const HTML_DEFAULT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="AI Website Builder - Modern TailwindCSS + Flowbite Template">
  <title>AI Website Builder</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Custom Tailwind Config for Colors -->
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {colorCodes},
        backgroundImage: {
          gradient: 'linear-gradient(90deg, #6366F1 0%, #10B981 100%)', // Primary → Secondary
        },
      },
    },
  };
</script>

  <!-- Flowbite CSS & JS -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>

  <!-- Font Awesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+zQj+Mj7Vp7k8E5x29nLNX6j+CWeN/Xg7fGqOpM8R1+a5/fQ1fJbO1Tz2uE5wP5yQ5uI5uA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <!-- Chart.js for charts & graphs -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <!-- AOS (Animate On Scroll) for scroll animations -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>

  <!-- GSAP (GreenSock) for advanced animations -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

  <!-- Lottie for JSON-based animations -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.11.2/lottie.min.js"></script>

  <!-- Swiper.js for sliders/carousels -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js"></script>

  <!-- Optional: Tooltip & Popover library (Tippy.js) -->
  <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css" />
  <script src="https://unpkg.com/@popperjs/core@2"></script>
  <script src="https://unpkg.com/tippy.js@6"></script>
</head>

{code}

</html>
`;

type props = {
  slide: { code: string };
  colors: any;
  setUpdateSlider: (code: string) => void;
};

function SliderFrame({ slide, colors, setUpdateSlider }: props) {
  const FINAL_CODE = HTML_DEFAULT.replace(
    "{colorCodes}",
    JSON.stringify(colors)
  ).replace("{code}", slide?.code);

  const iframeRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const selectedElRef = useRef<HTMLElement | null>(null);
  const [cardPosition, setCardPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    // Write the HTML inside the iframe
    doc.open();
    doc.write(FINAL_CODE);
    doc.close();

    // Allow iframe to capture keyboard events
    //doc.body.setAttribute("tabindex", "0");

    let hoverEl: HTMLElement | null = null;
    let selectedEl: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      if (selectedEl) return;
      const target = e.target as HTMLElement;
      if (hoverEl && hoverEl !== target) hoverEl.style.outline = "";
      hoverEl = target;
      hoverEl.style.outline = "2px dotted blue";
    };

    const handleMouseOut = () => {
      if (selectedEl) return;
      if (hoverEl) {
        hoverEl.style.outline = "";
        hoverEl = null;
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation(); // ✅ allow editing text inside
      const target = e.target as HTMLElement;

      if (selectedEl && selectedEl !== target) {
        selectedEl.style.outline = "";
        selectedEl.removeAttribute("contenteditable");
      }

      selectedEl = target;

      selectedElRef.current = target;

      if (selectedEl && selectedEl !== target) {
        selectedEl.style.outline = "";
        selectedEl.removeAttribute("contenteditable");
      }

      selectedEl = target;
      selectedEl.style.outline = "2px solid blue";
      selectedEl.setAttribute("contenteditable", "true");
      selectedEl.focus();

      console.log("Selected element:", selectedEl);
      // ✅ Attach blur event dynamically
      // selectedEl?.addEventListener("blur", handleBlur);

      // ✅ Calculate position relative to iframe container
      const rect = target.getBoundingClientRect();
      const iframeRect = iframe.getBoundingClientRect();

      setCardPosition({
        x: iframeRect.left + rect.left + rect.width / 2,
        y: iframeRect.top + rect.bottom,
      });
    };

    const handleBlur = () => {
      if (selectedEl) {
        console.log("Final edited element:", selectedEl.outerHTML);
        const updatedSliderCode = iframe.contentDocument?.body?.innerHTML;
        console.log(updatedSliderCode);
        setUpdateSlider(updatedSliderCode);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedEl) {
        selectedEl.style.outline = "";
        selectedEl.removeAttribute("contenteditable");
        selectedEl.removeEventListener("blur", handleBlur);
        selectedEl = null;
      }
    };

    // ✅ Wait for DOM content to be ready
    doc.addEventListener("DOMContentLoaded", () => {
      doc.body?.addEventListener("mouseover", handleMouseOver);
      doc.body?.addEventListener("mouseout", handleMouseOut);
      doc.body?.addEventListener("click", handleClick);
      doc.body?.addEventListener("keydown", handleKeyDown);
    });

    // ✅ Cleanup listeners on unmount
    return () => {
      doc.body?.removeEventListener("mouseover", handleMouseOver);
      doc.body?.removeEventListener("mouseout", handleMouseOut);
      doc.body?.removeEventListener("click", handleClick);
      doc.body?.removeEventListener("keydown", handleKeyDown);
    };
  }, [slide?.code]);


  return (
    <div className="mb-5">
      <iframe
        ref={iframeRef}
        className="w-[800px] h-[500px] border-0 rounded-2xl"
        sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups" // ✅ full sandbox permissions
      />

      {/* <FloatingActionTool
        position={cardPosition}
        onClose={() => setCardPosition(null)}
        loading={loading}
        handleAiChange={(value: string) => handleAiSectionChange(value)}
      /> */}
    </div>
  );
}

export default SliderFrame;
