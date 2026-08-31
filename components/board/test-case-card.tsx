"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Shield, ToggleLeft, Activity, Users, Zap, CheckCircle2, Image, ArrowRight, X, Clock, ExternalLink } from "lucide-react";
import type { TestCase, TestCasePriority, TestCaseStatus, Environment } from "@/types/database";
import { cn } from "@/lib/utils";

interface TestCaseCardProps {
  testCase: TestCase;
  onClick: (testCase: TestCase) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, overId: string) => void;
  isSelected?: boolean;
  onSelectToggle?: (id: string) => void;
  isSelectionMode?: boolean;
  moduleName?: string;
  testerName?: string;
  environment?: Environment;
  onMoveStatus?: (id: string, nextStatus: TestCaseStatus) => void;
}

const priorityColorMap: Record<TestCasePriority, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

const priorityBorderMap: Record<TestCasePriority, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-blue-500",
};

// Logical workflow progression map
const NEXT_STATUS_MAP: Record<TestCaseStatus, TestCaseStatus | null> = {
  open: "Fixed",
  reopen: "Fixed",
  todiscuss: "open",
  Fixed: "closed",
  closed: "reopen",
};

const nextStatusLabel: Record<TestCaseStatus, string> = {
  open: "Mark Fixed",
  reopen: "Mark Fixed",
  todiscuss: "Move to Open",
  Fixed: "Close Bug",
  closed: "Reopen Bug",
};

// Helper to determine if a URL points directly to an image payload
const isDirectImageUrl = (url: string | null): boolean => {
  if (!url) return false;
  if (url.startsWith("data:image/") || url.startsWith("blob:")) return true;
  const cleanUrl = url.toLowerCase().split(/[?#]/)[0];
  const hasImageExtension = /\.(jpeg|jpg|gif|png|webp|svg)$/.test(cleanUrl);
  const isStorageProvider = url.includes("/storage/v1/object/public/") || url.includes("supabase.co/storage");
  return hasImageExtension || isStorageProvider;
};

export const TestCaseCard: React.FC<TestCaseCardProps> = ({
  testCase,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  isSelected,
  onSelectToggle,
  isSelectionMode,
  moduleName,
  testerName,
  environment,
  onMoveStatus,
}) => {
  // Aging calculations
  const createdDate = new Date(testCase.created_at || Date.now());
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isStale =
    diffDays > 7 &&
    (testCase.status === "open" ||
      testCase.status === "reopen" ||
      testCase.status === "todiscuss");

  // Relative time helper
  const getRelativeTimeStr = (): string => {
    if (!testCase.created_at) return "";
    const created = new Date(testCase.created_at);
    
    // Reset time part to compare full calendar days
    const d1 = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diff = d2.getTime() - d1.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return "today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };
  const relativeTimeStr = getRelativeTimeStr();

  // Hover preview & modal states
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringTrigger, setIsHoveringTrigger] = useState(false);
  const [isHoveringPopover, setIsHoveringPopover] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const screenshotUrls = testCase.screenshot_urls || [];
  const screenshotUrl = screenshotUrls[0] || null;
  const screenshotUrl2 = screenshotUrls[1] || null;
  const showHoverPreview = (isHoveringTrigger || isHoveringPopover) && !!screenshotUrl;
  const isDirectImage = isDirectImageUrl(screenshotUrl);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 280;
    let x = rect.right + 12;
    // Bounds check: if popover would go off the right of the screen, place it to the left
    if (x + popoverWidth > window.innerWidth) {
      x = rect.left - popoverWidth - 12;
    }
    setHoverPosition({
      x,
      y: Math.max(10, rect.top - 40),
    });
    setIsHoveringTrigger(true);
  };

  const handleMouseLeave = () => {
    setIsHoveringTrigger(false);
  };

  const nextStatus = NEXT_STATUS_MAP[testCase.status];

  // Safely extract hostname for external links
  let externalHostname = "Link";
  if (screenshotUrl) {
    try {
      externalHostname = new URL(screenshotUrl).hostname;
    } catch {
      externalHostname = "External link";
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, testCase.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, testCase.id)}
      onClick={() => onClick(testCase)}
      className="cursor-grab active:cursor-grabbing select-none"
    >
      <Card
        className={cn(
          "hover:border-primary/45 transition-all duration-200 bg-card border border-l-[3px] shadow-sm hover:shadow-md relative group",
          priorityBorderMap[testCase.priority],
          isStale && "border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.08)] dark:bg-amber-500/[0.01]"
        )}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {isSelectionMode && onSelectToggle && (
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelectToggle(testCase.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 ml-auto overflow-hidden">
              {relativeTimeStr && (
                <span 
                  className="text-[10px] text-muted-foreground/75 shrink-0" 
                  title={`Added on: ${new Date(testCase.created_at).toLocaleString()}`}
                >
                  {relativeTimeStr}
                </span>
              )}
              {relativeTimeStr && (isStale || moduleName) && (
                <span className="text-muted-foreground/30 text-[10px] shrink-0 select-none">•</span>
              )}
              {isStale && (
                <span
                  className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 animate-pulse"
                  title={`Stale active bug: ${diffDays} days old`}
                >
                  <Clock className="h-2.5 w-2.5" />
                  {diffDays}d
                </span>
              )}
              {moduleName && (
                <span
                  className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded font-medium truncate max-w-[90px]"
                  title={moduleName}
                >
                  {moduleName}
                </span>
              )}
              {testerName && (
                <span
                  className="text-[10px] text-muted-foreground/80 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded font-medium truncate max-w-[90px] flex items-center gap-0.5"
                  title={`Tester: ${testerName}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  {testerName}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider shrink-0">
                {testCase.priority}
              </span>
              <span className={cn("h-2 w-2 rounded-full shrink-0", priorityColorMap[testCase.priority])} />
            </div>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
            {testCase.title}
          </h4>

          {/* Description */}
          {testCase.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed" >
              {testCase.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-3 border-t border-border/50 h-8">
            <div className="flex items-center gap-1">
              <span>{testCase.steps.length} steps</span>
              {screenshotUrl && (
                <span
                  className={cn(
                    "ml-2 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md transition-all cursor-pointer font-semibold shadow-sm select-none border",
                    isDirectImage
                      ? "text-primary bg-primary/5 hover:bg-primary hover:text-primary-foreground border-primary/20 hover:border-primary"
                      : "text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500 hover:text-white border-sky-500/20 hover:border-sky-500"
                  )}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isDirectImage) {
                      setIsModalOpen(true);
                    } else {
                      window.open(screenshotUrl!, "_blank");
                    }
                  }}
                >
                  {isDirectImage ? <Image className="h-2.5 w-2.5" /> : <ExternalLink className="h-2.5 w-2.5" />}
                  <span>{isDirectImage ? "Screenshot 1" : "Link 1"}</span>
                </span>
              )}
              {screenshotUrl2 && (
                <span
                  className={cn(
                    "ml-1 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md transition-all cursor-pointer font-semibold shadow-sm select-none border",
                    isDirectImageUrl(screenshotUrl2)
                      ? "text-primary bg-primary/5 hover:bg-primary hover:text-primary-foreground border-primary/20 hover:border-primary"
                      : "text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500 hover:text-white border-sky-500/20 hover:border-sky-500"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isDirectImageUrl(screenshotUrl2)) {
                      window.open(screenshotUrl2, "_blank");
                    } else {
                      window.open(screenshotUrl2, "_blank");
                    }
                  }}
                >
                  {isDirectImageUrl(screenshotUrl2) ? <Image className="h-2.5 w-2.5" /> : <ExternalLink className="h-2.5 w-2.5" />}
                  <span>{isDirectImageUrl(screenshotUrl2) ? "Screenshot 2" : "Link 2"}</span>
                </span>
              )}
            </div>

            {/* Hover Actions: Quick Move */}
            {nextStatus && onMoveStatus && !isSelectionMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStatus(testCase.id, nextStatus);
                }}
                className="opacity-0 group-hover:opacity-100 transition-all duration-150 h-6 px-2.5 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 shadow-sm border border-primary/15 hover:border-primary"
                title={`Move status to ${nextStatus}`}
              >
                <span>{nextStatusLabel[testCase.status]}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Hover Popover */}
      {showHoverPreview && hoverPosition && screenshotUrl && (
        <div
          style={{
            position: "fixed",
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            zIndex: 100,
          }}
          className="w-[280px] rounded-xl border border-border/80 bg-card/95 backdrop-blur-md p-2.5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150 cursor-pointer"
          onMouseEnter={() => setIsHoveringPopover(true)}
          onMouseLeave={() => setIsHoveringPopover(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (isDirectImage) {
              setIsModalOpen(true);
            } else {
              window.open(screenshotUrl!, "_blank");
            }
            setIsHoveringPopover(false);
          }}
        >
          {isDirectImage ? (
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted/20">
              <img
                src={screenshotUrl}
                alt="Screenshot Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-border/60 bg-sky-500/[0.03] text-center gap-2">
              <ExternalLink className="h-6 w-6 text-sky-500" />
              <span className="text-xs font-bold text-foreground">External Screenshot</span>
              <span className="text-[10px] text-muted-foreground break-all max-w-full font-mono bg-muted/50 px-1 py-0.5 rounded">
                {externalHostname}
              </span>
            </div>
          )}
          <div className="mt-2 px-1 flex items-center justify-between text-[9px] text-muted-foreground font-medium">
            <span>{isDirectImage ? "Hover preview" : "External Link"}</span>
            <span className="text-primary hover:underline">
              {isDirectImage ? "Click to view full size" : "Click to open in new tab"}
            </span>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox Modal */}
      {isModalOpen && isDirectImage && screenshotUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <button
              className="absolute -top-12 right-0 text-white hover:text-destructive bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-150 active:scale-95 shadow-md border border-white/5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={screenshotUrl}
              alt="Full Size Screenshot"
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {testCase.title && (
              <p className="text-white text-xs font-semibold mt-4 bg-black/60 px-4 py-2 rounded-full border border-white/5 select-text shadow-lg">
                {testCase.title}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};