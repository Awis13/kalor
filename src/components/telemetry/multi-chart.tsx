"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/lib/agua-types";

interface MultiChartProps {
  data: HistoryEntry[];
}

const SERIES_CONFIG: Record<
  string,
  { label: string; color: string; yAxisId: string; dataKey: keyof HistoryEntry }
> = {
  room: { label: "Room", color: "#f59e0b", yAxisId: "left", dataKey: "roomTemp" },
  fumes: { label: "Fumes", color: "#ef4444", yAxisId: "right", dataKey: "fumesTemp" },
  water: { label: "Water", color: "#3b82f6", yAxisId: "left", dataKey: "waterTemp" },
  power: { label: "Power", color: "#22c55e", yAxisId: "left", dataKey: "powerLevel" },
};

const ALL_SERIES = Object.keys(SERIES_CONFIG);

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-muted-foreground">
        {label ? formatTime(label) : ""}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toFixed(1)}
        </p>
      ))}
    </div>
  );
}

export function MultiChart({ data }: MultiChartProps) {
  const [visibleSeries, setVisibleSeries] = useState<string[]>(["room", "fumes"]);

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {data.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg bg-card text-sm text-muted-foreground">
          No history data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              tick={{ fill: '#a3a3a3', fontSize: 10 }}
              stroke="rgba(255,255,255,0.1)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#a3a3a3', fontSize: 10 }}
              stroke="rgba(255,255,255,0.1)"
              tickLine={false}
              axisLine={false}
              width={30}
              domain={[0, 40]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#a3a3a3', fontSize: 10 }}
              stroke="rgba(255,255,255,0.1)"
              tickLine={false}
              axisLine={false}
              width={30}
              domain={[0, 300]}
            />
            <Tooltip content={<CustomTooltip />} />
            {ALL_SERIES.map((key) => {
              const config = SERIES_CONFIG[key];
              if (!visibleSeries.includes(key)) return null;
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={config.dataKey}
                  name={config.label}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  yAxisId={config.yAxisId}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Переключатели серий */}
      <div className="flex flex-wrap justify-center gap-2">
        {ALL_SERIES.map((key) => {
          const config = SERIES_CONFIG[key];
          const isVisible = visibleSeries.includes(key);
          return (
            <Button
              key={key}
              size="sm"
              variant="outline"
              onClick={() => toggleSeries(key)}
              className={cn(
                "h-7 gap-1.5 px-2.5 text-xs",
                !isVisible && "opacity-40"
              )}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
