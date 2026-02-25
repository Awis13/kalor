"use client";

import { STATUS_COLORS } from "@/lib/agua-constants";
import { cn } from "@/lib/utils";

interface StoveStatusBadgeProps {
  status: number;
  statusText: string;
}

const COLOR_MAP: Record<string, string> = {
  gray: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  green: "bg-green-500/15 text-green-400 border-green-500/30",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function StoveStatusBadge({ status, statusText }: StoveStatusBadgeProps) {
  const colorKey = STATUS_COLORS[status] ?? "gray";
  const colorClasses = COLOR_MAP[colorKey] ?? COLOR_MAP.gray;

  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center rounded-lg border p-3 text-sm font-semibold",
        colorClasses
      )}
    >
      {statusText}
    </div>
  );
}
