"use client";

import React, { useRef, useState, useCallback } from "react";
import { ImagePlus, X, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropZoneProps {
  onImageAdd: (base64: string, mimeType: string) => void;
  onImageRemove: (index: number) => void;
  images: Array<{ base64: string; mimeType: string }>;
  className?: string;
  maxImages?: number;
}

/**
 * Compress an image File to JPEG at reduced resolution before base64-encoding.
 * - Max dimension: 900px (width or height, preserving aspect ratio)
 * - JPEG quality: 0.70
 * This keeps AI vision quality high while cutting token count by ~70-85%
 * vs sending an uncompressed full-resolution PNG screenshot.
 */
function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX_DIM = 900;
      let { width, height } = img;

      // Downscale if larger than MAX_DIM in either dimension
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      ctx.drawImage(img, 0, 0, width, height);

      // Always output as JPEG for maximum compression (PNG can be 10x larger)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.70);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mimeType: "image/jpeg" });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
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
  const [processing, setProcessing] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      if (images.length >= maxImages) return;
      if (!file.type.startsWith("image/")) return;

      try {
        const { base64, mimeType } = await compressImage(file);
        onImageAdd(base64, mimeType);
      } catch {
        // Fallback: read as-is if canvas compression fails
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const base64 = dataUrl.split(",")[1];
          onImageAdd(base64, file.type);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageAdd, images.length, maxImages]
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      setProcessing(true);
      const remainingSlots = maxImages - images.length;
      const toProcess = files.filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
      // Process sequentially to avoid race conditions on images.length check
      for (const file of toProcess) {
        await processFile(file);
      }
      setProcessing(false);
    },
    [processFile, images.length, maxImages]
  );

  // Handle paste event (Ctrl+V)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) processFiles(imageFiles);
    },
    [processFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
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
          onClick={() => !processing && inputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-pointer select-none",
            "min-h-[100px] px-4 py-5 text-center",
            processing && "pointer-events-none opacity-70",
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
            {processing ? (
              <Loader2 className="h-5 w-5 text-primary/60 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5 text-primary/60" />
                <Upload className="h-4 w-4 text-primary/40" />
              </>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {processing ? "Compressing image…" : "Paste screenshot or drop image here"}
            </p>
            {!processing && (
              <>
                <p className="text-[10px] text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">Ctrl+V</kbd> to paste · or click to upload
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  Up to {maxImages} images · auto-compressed to save AI quota
                </p>
              </>
            )}
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
            ✅ {images.length} screenshot{images.length !== 1 ? "s" : ""} attached — compressed &amp; ready for AI
          </div>
        </div>
      )}
    </div>
  );
}
