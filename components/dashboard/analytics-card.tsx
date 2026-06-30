"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnalyticsCardProps {
  title: string;
  value: number;
  suffix?: string;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  suffix = "",
  change,
  trend = "neutral",
  icon: Icon,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    const duration = 1000; // 1s animation
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / end)) || 20;
    
    const timer = setInterval(() => {
      start += increment;
      setDisplayValue(start);
      if (start === end) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className={cn(
      "relative overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 bg-gradient-to-b from-card to-card/50",
      trend === "up" && "border-t-4 border-t-emerald-500/80",
      trend === "down" && "border-t-4 border-t-destructive/80",
      trend === "neutral" && "border-t-4 border-t-primary/50"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">
            {displayValue}
            {suffix}
          </span>
          
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full",
                trend === "up" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                trend === "down" && "bg-destructive/15 text-destructive",
                trend === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
              {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
              {trend === "neutral" && <Minus className="h-3 w-3" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        {/* <div className="mt-2 text-[10px] text-muted-foreground">
          Compared to last week
        </div> */}
      </CardContent>
    </Card>
  );
};
