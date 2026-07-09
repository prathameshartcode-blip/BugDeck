"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface TestStatusChartProps {
  data: Array<{ name: string; value: number; color: string; statusKey?: string }>;
  title?: string;
  description?: string;
  /** If provided, clicking a segment will route to this project's board */
  projectId?: string;
  /** "board" → /projects/[id]/board  |  "runtest" → /projects/[id]/runtest */
  boardType?: "board" | "runtest";
}

export const TestStatusChart: React.FC<TestStatusChartProps> = ({
  data,
  title = "Test Status Distribution",
  description = "Breakdown of current test run execution status.",
  projectId,
  boardType,
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="col-span-3 h-[350px] flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading charts...</span>
      </Card>
    );
  }

  const chartData = data.filter((item) => item.value > 0);

  const isClickable = !!projectId && !!boardType;

  const handleSliceClick = (_: unknown, index: number) => {
    if (!isClickable) return;
    const entry = chartData[index];
    // Use statusKey if provided, otherwise lowercase the name and replace spaces with underscores
    const statusParam = entry.statusKey ?? entry.name.toLowerCase().replace(/\s+/g, "_");
    router.push(`/projects/${projectId}/${boardType}?status=${encodeURIComponent(statusParam)}`);
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
          {isClickable && (
            <span className="ml-1 text-primary/70 font-medium">Click a segment to filter.</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] flex items-center justify-center">
        {chartData.length === 0 ? (
          <span className="text-muted-foreground text-xs">No data yet.</span>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                onClick={isClickable ? handleSliceClick : undefined}
                onMouseEnter={(_, index) => isClickable && setActiveIndex(index)}
                onMouseLeave={() => isClickable && setActiveIndex(null)}
                style={{ cursor: isClickable ? "pointer" : "default" }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.55}
                    stroke={activeIndex === index ? "white" : "transparent"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    style={{
                      filter: activeIndex === index ? "brightness(1.15) drop-shadow(0 0 6px rgba(255,255,255,0.3))" : "none",
                      transition: "opacity 0.2s ease, filter 0.2s ease",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border bg-card p-2.5 shadow-md text-xs">
                        <span className="font-semibold" style={{ color: payload[0].payload.color }}>
                          {payload[0].name}: {payload[0].value}
                        </span>
                        {isClickable && (
                          <p className="text-muted-foreground mt-0.5">Click to filter board</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};