import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { FontSizeControl } from "./font-size-control";
import type { Textbox } from "fabric";

interface ToolbarProps {
  onAddText: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => Promise<void>;
  selectedTextbox: Textbox | null;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

export function Toolbar({
  onAddText,
  onExportJSON,
  onImportJSON,
  selectedTextbox,
  fontSize,
  onFontSizeChange,
}: ToolbarProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await onImportJSON(file);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load JSON file. Please check the file format.";
      alert(errorMessage);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 border-b bg-background">
      <Button onClick={onAddText} variant="default">
        Add Text
      </Button>

      {selectedTextbox && (
        <FontSizeControl
          textbox={selectedTextbox}
          fontSize={fontSize}
          onFontSizeChange={onFontSizeChange}
        />
      )}

      <div className="flex-1" />

      <Button onClick={onExportJSON} variant="outline">
        Download JSON
      </Button>

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
      >
        Upload JSON
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload JSON file"
      />
    </div>
  );
}

