"use client";

import React, { useState } from "react";
import { RunTestCard } from "./runtest-card";
import type { RunTestCase, RunTestStatus } from "@/types/database";
import { cn } from "@/lib/utils";

interface RunTestColumnProps {
  id: RunTestStatus;
  title: string;
  color: string;
  testCases: RunTestCase[];
  onTestCaseClick: (testCase: RunTestCase) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDropTestCase: (id: string, status: RunTestStatus, overId?: string) => void;
}

export const RunTestColumn: React.FC<RunTestColumnProps> = ({
  id,
  title,
  color,
  testCases = [],
  onTestCaseClick,
  onDragStart,
  onDropTestCase,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDropColumn = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const tcId = e.dataTransfer.getData("text/plain");
    if (tcId) onDropTestCase(tcId, id);
  };

  const handleDropOnCard = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const tcId = e.dataTransfer.getData("text/plain");
    if (tcId) onDropTestCase(tcId, id, overId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropColumn}
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-xl bg-muted/40 border border-transparent p-3 min-h-[450px] transition-all duration-200",
        isDragOver && "border-dashed border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between pb-3 mb-2 px-1 border-b border-border/40 select-none">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
          <h3 className="text-xs font-bold text-foreground">{title}</h3>
        </div>
        <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
          {testCases.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[600px] pr-0.5 scrollbar-thin">
        {testCases.length === 0 ? (
          <div className="flex h-36 items-center justify-center border border-dashed border-border/40 rounded-lg text-[10px] text-muted-foreground select-none pointer-events-none">
            No test cases here
          </div>
        ) : (
          testCases.map((tc) => (
            <RunTestCard
              key={tc.id}
              testCase={tc}
              onClick={onTestCaseClick}
              onDragStart={onDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDropOnCard}
            />
          ))
        )}
      </div>
    </div>
  );
};
