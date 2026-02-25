"use client";

import { AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AlarmEntry {
  code: number;
  text: string;
  timestamp: number;
}

interface AlarmHistoryListProps {
  alarms: AlarmEntry[];
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

export function AlarmHistoryList({ alarms }: AlarmHistoryListProps) {
  if (alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <AlertTriangle className="mb-2 h-8 w-8 opacity-30" />
        <span className="text-sm">No alarm history</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="flex flex-col gap-2 pr-4">
        {alarms.map((alarm, index) => (
          <div
            key={`${alarm.timestamp}-${index}`}
            className="flex items-start gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">
                #{alarm.code} &mdash; {alarm.text}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(alarm.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
