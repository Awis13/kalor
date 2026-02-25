"use client";

import type { GaugeConfig } from "@/lib/agua-types";
import { Card, CardContent } from "@/components/ui/card";
import { SensorGauge } from "@/components/telemetry/sensor-gauge";

interface SensorCardProps {
  config: GaugeConfig;
  value: number;
  history?: number[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 24;
  const padding = 2;

  const points = data
    .slice(-30) // последние 30 точек
    .map((v, i, arr) => {
      const x = padding + (i / (arr.length - 1)) * (width - 2 * padding);
      const y =
        height - padding - ((v - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-6 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />
    </svg>
  );
}

export function SensorCard({ config, value, history }: SensorCardProps) {
  // Определяем цвет для sparkline по текущей зоне
  let sparkColor = "#6b7280";
  for (const zone of config.zones) {
    if (value >= zone.min && value <= zone.max) {
      sparkColor = zone.color;
      break;
    }
  }

  return (
    <Card className="py-3">
      <CardContent className="px-3">
        <SensorGauge
          label={config.label}
          unit={config.unit}
          min={config.min}
          max={config.max}
          value={value}
          zones={config.zones}
          decimals={config.decimals}
        />
        {history && history.length > 1 && (
          <div className="mt-1">
            <MiniSparkline data={history} color={sparkColor} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
