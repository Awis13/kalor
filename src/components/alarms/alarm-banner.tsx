"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlarmBannerProps {
  alarmCode: number;
  alarmText: string;
  hasAlarm: boolean;
}

export function AlarmBanner({ alarmCode, alarmText, hasAlarm }: AlarmBannerProps) {
  if (!hasAlarm) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3",
        "animate-pulse",
        alarmCode >= 3
          ? "border-red-500/50 bg-red-500/10 text-red-400"
          : "border-amber-500/50 bg-amber-500/10 text-amber-400"
      )}
    >
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">Alarm #{alarmCode}</span>
        <span className="text-xs opacity-80">{alarmText}</span>
      </div>
    </div>
  );
}
