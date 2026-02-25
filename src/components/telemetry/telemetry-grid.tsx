"use client";

import type { GaugeConfig } from "@/lib/agua-types";
import { TELEMETRY_GAUGES } from "@/lib/agua-constants";
import { SensorCard } from "@/components/telemetry/sensor-card";

interface TelemetryGridProps {
  registers: Record<string, number>;
}

export function TelemetryGrid({ registers }: TelemetryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TELEMETRY_GAUGES.map((gauge) => {
        const value = registers[gauge.registerKey] ?? 0;
        // Приводим readonly const к GaugeConfig
        const config: GaugeConfig = {
          label: gauge.label,
          unit: gauge.unit,
          min: gauge.min,
          max: gauge.max,
          registerKey: gauge.registerKey,
          decimals: gauge.decimals,
          zones: [...gauge.zones],
        };
        return (
          <SensorCard
            key={gauge.registerKey}
            config={config}
            value={value}
          />
        );
      })}
    </div>
  );
}
