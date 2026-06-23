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
}

const priorityColorMap: Record<TestCasePriority, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

export const TestCaseCard: React.FC<TestCaseCardProps> = ({ testCase, onClick, onDragStart, onDragOver, onDrop }) => {
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
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {testCase.priority}
              </span>
              <span className={cn("h-2 w-2 rounded-full", priorityColorMap[testCase.priority])} />
            </div>
          </div>

          {/* Title */}
          <h4 className="text-xs font-semibold leading-snug text-foreground line-clamp-2">
            {testCase.title}
          </h4>

          {/* Description */}
          {testCase.description && (
            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-normal">
              {testCase.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-2 border-t border-border/50">
            <span>{testCase.steps.length} steps</span>
            <span className="font-semibold text-foreground bg-secondary/80 px-1.5 py-0.5 rounded truncate max-w-[100px]">
              ID: {testCase.id}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
