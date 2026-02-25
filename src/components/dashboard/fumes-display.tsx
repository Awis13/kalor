"use client";

import { Thermometer } from "lucide-react";

interface FumesDisplayProps {
  fumesTemp: number;
}

export function FumesDisplay({ fumesTemp }: FumesDisplayProps) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card p-3">
      <Thermometer className="h-4 w-4 text-red-400" />
      <span className="text-sm text-muted-foreground">Fumes</span>
      <span className="text-sm font-semibold text-foreground">
        {fumesTemp.toFixed(0)}°C
      </span>
    </div>
  );
}
