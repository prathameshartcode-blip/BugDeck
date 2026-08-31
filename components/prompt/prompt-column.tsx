"use client";

import React, { useState } from "react";
import { PromptCard } from "./prompt-card";
import type { TestCase, TestCaseStatus, Module } from "@/types/database";
import { cn } from "@/lib/utils";
import { Inbox, PartyPopper } from "lucide-react";

interface PromptColumnProps {
  id: TestCaseStatus;
  title: string;
  color: string;
  testCases: TestCase[];
  onTestCaseClick: (testCase: TestCase) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDropTestCase: (id: string, status: TestCaseStatus, overId?: string) => void;
  selectedCases?: string[];
  onSelectToggle?: (id: string) => void;
  onSelectAllInColumn?: (ids: string[], selectAll: boolean) => void;
  isSelectionMode?: boolean;
  modules?: Module[];
}

export const PromptColumn: React.FC<PromptColumnProps> = ({
  id,
  title,
  color,
  testCases = [],
  onTestCaseClick,
  onDragStart,
  onDropTestCase,
  selectedCases = [],
  onSelectToggle,
  onSelectAllInColumn,
  isSelectionMode,
  modules = [],
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
    if (tcId) {
      onDropTestCase(tcId, id);
    }
  };

  const handleDropOnCard = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const tcId = e.dataTransfer.getData("text/plain");
    if (tcId) {
      onDropTestCase(tcId, id, overId);
    }
  };

  const columnIds = testCases.map((tc) => tc.id);
  const allSelected = columnIds.length > 0 && columnIds.every((id) => selectedCases.includes(id));
  const someSelected = columnIds.some((id) => selectedCases.includes(id));

  const handleColumnCheckbox = () => {
    if (onSelectAllInColumn) {
      onSelectAllInColumn(columnIds, !allSelected);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropColumn}
      className={cn(
        "flex flex-col w-[340px] shrink-0 rounded-2xl bg-muted/30 border border-border/40 p-3.5 min-h-[450px] transition-all duration-300 shadow-sm",
        isDragOver && "border-primary/50 bg-primary/5 ring-1 ring-primary/20 scale-[1.01]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 px-1 border-b border-border/40 select-none">
        <div className="flex items-center gap-2">
          {isSelectionMode && columnIds.length > 0 && (
            <button
              type="button"
              onClick={handleColumnCheckbox}
              className="flex-shrink-0 h-4 w-4 rounded border border-border flex items-center justify-center transition-colors hover:border-primary"
              style={{
                backgroundColor: allSelected ? 'hsl(var(--primary))' : someSelected ? 'hsl(var(--primary) / 0.2)' : 'transparent',
                borderColor: (allSelected || someSelected) ? 'hsl(var(--primary))' : undefined,
              }}
              title={allSelected ? 'Deselect all in column' : 'Select all in column'}
            >
              {allSelected && (
                <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {!allSelected && someSelected && (
                <svg className="h-2.5 w-2.5" style={{ color: 'hsl(var(--primary))' }} fill="none" viewBox="0 0 12 12">
                  <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}
          <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
          <h3 className="text-xs font-bold text-foreground capitalize">{title}</h3>
        </div>
        <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
          {testCases.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[600px] pr-0.5 scrollbar-thin">
        {testCases.length === 0 ? (
          <div className="flex flex-col h-36 items-center justify-center gap-2 border border-dashed border-border/40 rounded-lg text-center px-3 select-none pointer-events-none">
            {id === "closed" ? (
              <PartyPopper className="h-4 w-4 text-muted-foreground/50" />
            ) : (
              <Inbox className="h-4 w-4 text-muted-foreground/50" />
            )}
            <p className="text-[10px] text-muted-foreground leading-snug">
              {id === "open"
                ? "Nothing open right now — drag a card here or add a new prompt."
                : id === "closed"
                ? "Nothing closed yet."
                : "No prompts in this column."}
            </p>
          </div>
        ) : (
          testCases.map((tc) => {
            const modName = modules.find((m) => m.id === tc.module_id)?.name;
            return (
              <PromptCard
                key={tc.id}
                testCase={tc}
                onClick={onTestCaseClick}
                onDragStart={onDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDropOnCard}
                isSelected={selectedCases.includes(tc.id)}
                onSelectToggle={onSelectToggle}
                isSelectionMode={isSelectionMode}
                moduleName={modName}
                onMoveStatus={onDropTestCase}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
