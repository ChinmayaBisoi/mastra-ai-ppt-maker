import React from "react";
import { Input } from "@/components/ui/input";
import type { Textbox } from "fabric";

interface FontSizeControlProps {
  textbox: Textbox;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

export function FontSizeControl({
  textbox,
  fontSize,
  onFontSizeChange,
}: FontSizeControlProps): React.JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize)) {
      onFontSizeChange(newSize);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 border-l">
      <label
        htmlFor="font-size"
        className="text-sm text-muted-foreground whitespace-nowrap"
      >
        Font Size:
      </label>
      <Input
        id="font-size"
        type="number"
        min="8"
        max="200"
        value={Math.round(fontSize)}
        onChange={handleChange}
        className="w-20"
        aria-label="Font size"
      />
    </div>
  );
}

