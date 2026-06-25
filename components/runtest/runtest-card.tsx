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
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {testCase.priority}
              </span>
              <span className={cn("h-2 w-2 rounded-full", priorityColorMap[testCase.priority])} />
            </div>
          </div>

          <h4 className="text-xs font-semibold leading-snug text-foreground line-clamp-2">
            {testCase.title}
          </h4>

          {testCase.description && (
            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-normal">
              {testCase.description}
            </p>
          )}

          <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-2 border-t border-border/50">
            <span>{testCase.steps.length} steps</span>
            {testCase.status === "failed" && testCase.failed_reason && (
              <span className="text-red-500 font-semibold truncate max-w-[100px]">Failed</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
