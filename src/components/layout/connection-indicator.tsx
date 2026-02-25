"use client";

import { cn } from "@/lib/utils";

interface ConnectionIndicatorProps {
  isOnline: boolean;
}

export function ConnectionIndicator({ isOnline }: ConnectionIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            isOnline ? "bg-green-500" : "bg-red-500"
          )}
        />
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          isOnline ? "text-green-500" : "text-red-500"
        )}
      >
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
}
