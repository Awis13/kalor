"use client";

import { Flame } from "lucide-react";

interface TemperatureDisplayProps {
  roomTemp: number;
  targetTemp: number;
  isOn: boolean;
}

export function TemperatureDisplay({
  roomTemp,
  targetTemp,
  isOn,
}: TemperatureDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1 pt-4">
      {isOn && (
        <Flame className="h-7 w-7 text-amber-500 animate-flame" />
      )}
      <span className="text-7xl font-extralight tabular-nums text-amber-400">
        {roomTemp.toFixed(1)}
        <span className="text-4xl">°</span>
      </span>
      <span className="text-sm text-muted-foreground">Room Temperature</span>
    </div>
  );
}
