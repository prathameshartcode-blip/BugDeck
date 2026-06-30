"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { RunTestCase, TestCasePriority } from "@/types/database";
import { cn } from "@/lib/utils";

interface RunTestCardProps {
  testCase: RunTestCase;
  onClick: (testCase: RunTestCase) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, overId: string) => void;
  isSelected?: boolean;
  onSelectToggle?: (id: string) => void;
  isSelectionMode?: boolean;
}

const priorityColorMap: Record<TestCasePriority, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

export const RunTestCard: React.FC<RunTestCardProps> = ({
  testCase,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  isSelected,
  onSelectToggle,
  isSelectionMode,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, testCase.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, testCase.id)}
      onClick={() => onClick(testCase)}
      className="cursor-grab active:cursor-grabbing select-none"
    >
      <Card className="hover:border-primary/40 hover:shadow-sm transition-all duration-200 bg-card border border-border">
        <CardContent className="p-4 space-y-3">
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
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {testCase.priority}
              </span>
              <span className={cn("h-2 w-2 rounded-full", priorityColorMap[testCase.priority])} />
            </div>
          </div>

          <h4 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
            {testCase.title}
          </h4>

          {testCase.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {testCase.description}
            </p>
          )}

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-3 border-t border-border/50">
            <span>{testCase.steps.length} steps</span>
            {testCase.status === "failed" && testCase.failed_reason && (
              <span className="text-red-500 font-semibold truncate max-w-[120px]">Failed</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
