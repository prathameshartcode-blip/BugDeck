"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUp, MessageSquare, PlayCircle, PlusCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export type ActivityItem = {
  id: string;
  type: "test_created" | "test_updated" | "status_changed" | "comment_added" | "document_uploaded";
  description: string;
  timestamp: string;
  user: string;
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

const iconMap = {
  test_created: PlusCircle,
  test_updated: PlayCircle,
  status_changed: CheckCircle,
  comment_added: MessageSquare,
  document_uploaded: FileUp,
};

const colorMap = {
  test_created: "text-sky-500 bg-sky-500/10",
  test_updated: "text-indigo-500 bg-indigo-500/10",
  status_changed: "text-emerald-500 bg-emerald-500/10",
  comment_added: "text-amber-500 bg-amber-500/10",
  document_uploaded: "text-violet-500 bg-violet-500/10",
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates and QA contributions on this project.</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
            No recent activity recorded.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((item, idx) => {
              const Icon = iconMap[item.type] || PlayCircle;
              const colorClass = colorMap[item.type] || "text-primary bg-primary/10";
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex gap-4 text-sm items-start"
                >
                  <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="font-medium text-foreground text-xs leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>By {item.user}</span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
