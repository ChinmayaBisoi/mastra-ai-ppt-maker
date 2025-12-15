"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { parse as parseViaPptxtojson } from "pptxtojson";

function TestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jsonResult, setJsonResult] = useState<Record<string, unknown> | null>(
    null
  );
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".pptx")) {
        setError("Please select a .pptx file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
      setJsonResult(null);
      setSavedFilePath(null);
    }
  };

  async function handleViaPptx2json(file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/test/pptx-to-json", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert PPTX to JSON");
      }

      const result = await response.json();
      setJsonResult(result.json);
      setSavedFilePath(result.savedFilePath);
      setSuccess(result.message || "Successfully converted PPTX to JSON!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to convert PPTX to JSON"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleViaPptxtojson(file: File) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target?.result || !(e.target.result instanceof ArrayBuffer))
        return;
      const json = await parseViaPptxtojson(e.target.result);
      console.log(json);
      setJsonResult(json);
      setSuccess("Successfully converted PPTX to JSON! via pptxtojson");
      setUploading(false);
    };
    reader.readAsArrayBuffer(file);
  }

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setJsonResult(null);
    setSavedFilePath(null);

    await handleViaPptxtojson(file);
    // await handleViaPptx2json(file);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>PPTX to JSON Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pptx-upload">Upload PPTX File</Label>
            <Input
              id="pptx-upload"
              type="file"
              accept=".pptx"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                MB)
              </p>
            )}
          </div>

          <Button
            onClick={handleConvert}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? "Converting..." : "Convert to JSON"}
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">
                {success}
              </p>
              {savedFilePath && (
                <p className="text-xs text-muted-foreground mt-2">
                  File saved to: {savedFilePath}
                </p>
              )}
            </div>
          )}

          {jsonResult && (
            <div className="space-y-2">
              <Label>JSON Output</Label>
              <Textarea
                readOnly
                value={JSON.stringify(jsonResult, null, 2)}
                className="font-mono text-xs min-h-[400px]"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TestPage;
