"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface TestStatusChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export const TestStatusChart: React.FC<TestStatusChartProps> = ({ data }) => {
  const [mounted, setMounted] = useState(false);

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

  // Filter out categories with 0 values to keep the pie clean
  const chartData = data.filter((item) => item.value > 0);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Test Status Distribution</CardTitle>
        <CardDescription>Breakdown of current test run execution status.</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] flex items-center justify-center">
        {chartData.length === 0 ? (
          <span className="text-muted-foreground text-xs">No test cases generated yet.</span>
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
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border bg-card p-2.5 shadow-md text-xs">
                        <span className="font-semibold" style={{ color: payload[0].payload.color }}>
                          {payload[0].name}: {payload[0].value} tests
                        </span>
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
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
