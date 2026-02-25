"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ChartDataPoint {
  timestamp: number;
  roomTemp: number;
  targetTemp: number;
  fumesTemp?: number;
}

interface TemperatureChartProps {
  data: ChartDataPoint[];
  showFumes?: boolean;
}

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
          {entry.name}: {entry.value?.toFixed(1)}°C
        </p>
      ))}
    </div>
  );
}

const TICK_STYLE = { fill: "#a3a3a3", fontSize: 10 };

export function TemperatureChart({
  data,
  showFumes = false,
}: TemperatureChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          tick={TICK_STYLE}
          stroke="rgba(255,255,255,0.1)"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={TICK_STYLE}
          stroke="rgba(255,255,255,0.1)"
          tickLine={false}
          axisLine={false}
          width={35}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="roomTemp"
          name="Room"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="targetTemp"
          name="Target"
          stroke="#6b7280"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
        />
        {showFumes && (
          <Line
            type="monotone"
            dataKey="fumesTemp"
            name="Fumes"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
