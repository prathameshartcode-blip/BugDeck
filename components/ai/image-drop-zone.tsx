"use client";

import React, { useRef, useState, useCallback } from "react";
import { ImagePlus, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropZoneProps {
  onImageChange: (base64: string, mimeType: string) => void;
  onImageClear: () => void;
  imageBase64: string | null;
  className?: string;
}

export function ImageDropZone({
  onImageChange,
  onImageClear,
  imageBase64,
  className,
}: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Strip data URL prefix to get pure base64
        const base64 = dataUrl.split(",")[1];
        onImageChange(base64, file.type);
      };
      reader.readAsDataURL(file);
    },
    [onImageChange]
  );

  // Handle paste event (Ctrl+V)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) processFile(file);
          break;
        }
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  if (imageBase64) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border border-border", className)}>
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt="Attached screenshot"
          className="w-full max-h-48 object-contain bg-muted/40"
        />
        <button
          type="button"
          onClick={onImageClear}
          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/90 border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="px-3 py-1.5 bg-muted/40 text-[10px] text-muted-foreground font-medium border-t border-border">
          ✅ Screenshot attached — AI will analyze this image
        </div>
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      onPaste={handlePaste}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-pointer select-none",
        "min-h-[100px] px-4 py-5 text-center",
        isDragging
          ? "border-primary bg-primary/10 scale-[1.01]"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <ImagePlus className="h-5 w-5 text-primary/60" />
        <Upload className="h-4 w-4 text-primary/40" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-foreground">
          Paste screenshot or drop image here
        </p>
        <p className="text-[10px] text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">Ctrl+V</kbd> to paste · or click to upload
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          PNG, JPG, WebP supported
        </p>
      </div>
    </div>
  );
}
