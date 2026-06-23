"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DocumentUploaderProps {
  onUploadSuccess: (extractedText: string, fileName: string) => void;
  isProcessing: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUploadSuccess, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const allowedExtensions = ["pdf", "docx", "txt", "html"];
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (fileExtension && allowedExtensions.includes(fileExtension)) {
      setFile(selectedFile);
      setUploadStatus("idle");
      setUploadProgress(0);
    } else {
      setUploadStatus("error");
      alert("Unsupported file type! Please upload a PDF, DOCX, TXT, or HTML document.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus("uploading");
    
    // Simulate upload progress
    const duration = 1200;
    const interval = 50;
    const step = 100 / (duration / interval);
    let currentProgress = 0;

    const timer = setInterval(async () => {
      currentProgress += step;
      setUploadProgress(Math.min(Math.round(currentProgress), 100));

      if (currentProgress >= 100) {
        clearInterval(timer);
        
        try {
          // Read file text
          const reader = new FileReader();
          reader.onload = async (e) => {
            const text = e.target?.result as string;
            setUploadStatus("done");
            // Pass the file content to parent
            onUploadSuccess(text || `Mock extracted content from ${file.name}. Valid modules: Authentication, User Profiles, Shopping Cart.`, file.name);
          };

          if (file.name.endsWith(".txt") || file.name.endsWith(".html")) {
            reader.readAsText(file);
          } else {
            // For binary files, pass a mock placeholder with rich text requirements to simulate extraction
            setTimeout(() => {
              setUploadStatus("done");
              onUploadSuccess(
                `REQUIREMENTS SPECIFICATION FOR THE NEW BANKING SYSTEM:
                 The banking portal has the following modules:
                 1. User Login: Handles username/password auth, MFA setup, password reset, lockout rules after 5 failed attempts.
                 2. Transaction History: Displays deposits, card transactions, search transactions by date, download CSV statement.
                 3. Money Transfer: Allows peer transfers, scheduling recurring bank transfers, validates recipient account number, checks account balances.
                 `,
                file.name
              );
            }, 800);
          }
        } catch (err) {
          setUploadStatus("error");
        }
      }
    }, interval);
  };

  const handleCancel = () => {
    setFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors select-none",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
          file ? "bg-card" : "bg-background"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.html"
          onChange={handleChange}
          id="doc-uploader-input"
        />

        {!file ? (
          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Drag & drop your requirements document here
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, DOCX, TXT, HTML (max 10MB)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded bg-primary/10 text-primary shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate max-w-[280px]">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              {uploadStatus !== "uploading" && !isProcessing && (
                <button
                  onClick={handleCancel}
                  className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {uploadStatus === "uploading" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Uploading document...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary font-medium justify-center animate-pulse">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>AI is analyzing requirements & extracting modules...</span>
              </div>
            )}

            {uploadStatus === "done" && !isProcessing && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                <span>Uploaded & analyzed successfully!</span>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="flex items-center gap-2 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to process document. Please try again.</span>
              </div>
            )}

            {uploadStatus === "idle" && (
              <div className="flex justify-end gap-2.5">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Clear
                </Button>
                <Button size="sm" onClick={handleUpload}>
                  Upload & Analyze
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
