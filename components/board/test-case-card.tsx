"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Shield, ToggleLeft, Activity, Users, Zap, CheckCircle2 } from "lucide-react";
import type { TestCase, TestCasePriority } from "@/types/database";
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

export const TestCaseCard: React.FC<TestCaseCardProps> = ({ testCase, onClick, onDragStart, onDragOver, onDrop, isSelected, onSelectToggle, isSelectionMode, moduleName }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, testCase.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, testCase.id)}
      onClick={() => onClick(testCase)}
      className="cursor-grab active:cursor-grabbing select-none"
    >
      <Card className={cn(
        "hover:border-primary/40 transition-all duration-150 bg-card border border-l-3 shadow-sm hover:shadow-md relative group",
        priorityBorderMap[testCase.priority]
      )}>
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
              {moduleName && (
                <span className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded font-medium truncate max-w-[90px]" title={moduleName}>
                  {moduleName}
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
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {testCase.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-3 border-t border-border/50">
            <span>{testCase.steps.length} steps</span>
            {/* <span className="font-semibold text-foreground bg-secondary/80 px-2 py-0.5 rounded truncate max-w-[120px]">
              ID: {testCase.id}
            </span> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};