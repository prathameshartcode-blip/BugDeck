"use client";

import React, { useRef, useState, useCallback } from "react";
import { ImagePlus, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropZoneProps {
  onImageAdd: (base64: string, mimeType: string) => void;
  onImageRemove: (index: number) => void;
  images: Array<{ base64: string; mimeType: string }>;
  className?: string;
  maxImages?: number;
}

export function ImageDropZone({
  onImageAdd,
  onImageRemove,
  images,
  className,
  maxImages = 5,
}: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (images.length >= maxImages) return;
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Strip data URL prefix to get pure base64
        const base64 = dataUrl.split(",")[1];
        onImageAdd(base64, file.type);
      };
      reader.readAsDataURL(file);
    },
    [onImageAdd, images.length, maxImages]
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
      const files = Array.from(e.dataTransfer.files);
      const remainingSlots = maxImages - images.length;
      files.slice(0, remainingSlots).forEach(file => {
        processFile(file);
      });
    },
    [processFile, images.length, maxImages]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = maxImages - images.length;
    files.slice(0, remainingSlots).forEach(file => {
      processFile(file);
    });
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const isLimitReached = images.length >= maxImages;

  return (
    <div className="space-y-3">
      {/* Upload Zone */}
      {!isLimitReached && (
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
            multiple
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
              Up to {maxImages} images total (PNG, JPG, WebP)
            </p>
          </div>
        </div>
      )}

      {/* Images Grid preview */}
      {images.length > 0 && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-border group bg-muted/20 aspect-video">
                <img
                  src={`data:${img.mimeType || "image/png"};base64,${img.base64}`}
                  alt={`Screenshot ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => onImageRemove(idx)}
                  className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-background/90 border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="px-3 py-1.5 bg-muted/40 text-[10px] text-muted-foreground font-medium rounded-md border border-border">
            ✅ {images.length} screenshot(s) attached — AI will reference all of them
          </div>
        </div>
      )}
    </div>
  );
}
