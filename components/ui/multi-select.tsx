"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const displayText =
    selected.length === 0
      ? `All ${placeholder}s`
      : selected.length === options.length
      ? `All ${placeholder}s`
      : selected.length > 2
      ? `${selected.length} Selected`
      : options
          .filter((o) => selected.includes(o.value))
          .map((o) => o.label)
          .join(", ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger onClick={() => setIsOpen(!isOpen)}>
        <button
          type="button"
          className={cn(
            "flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-all hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring text-left min-w-[140px]",
            className
          )}
        >
          <span className="truncate max-w-[110px]">{displayText}</span>
          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        open={isOpen}
        onClose={() => setIsOpen(false)}
        align="left"
        className="w-56 p-1 max-h-[300px] overflow-y-auto bg-card border-border/50 shadow-lg rounded-xl z-50"
      >
        <button
          type="button"
          onClick={handleSelectAll}
          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground text-left transition-colors border-b border-border/40 mb-1"
        >
          <span>Select All</span>
          {selected.length === options.length && (
            <Check className="h-3 w-3 text-primary" />
          )}
        </button>

        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground text-left transition-colors"
            >
              <span className="truncate">{option.label}</span>
              {isSelected && <Check className="h-3 w-3 text-primary" />}
            </button>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
