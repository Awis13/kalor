"use client";

import { useStoveHistory } from "@/hooks/use-stove-history";
import { TimeRangePicker } from "@/components/history/time-range-picker";
import { TemperatureChart } from "@/components/history/temperature-chart";
import { BarChart3 } from "lucide-react";

export default function HistoryPage() {
  const { history, range, setRange, isLoadingHistory } = useStoveHistory();

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold">Temperature History</h1>

      {/* Выбор диапазона */}
      <TimeRangePicker value={range} onChange={(v) => setRange(v as "1H" | "24H" | "7D" | "30D")} />

      {/* График */}
      {isLoadingHistory ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-card">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-card p-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No data yet</p>
          <p className="text-xs text-muted-foreground">
            Temperature data will appear here as the stove runs.
          </p>
        </div>
      ) : (
        <TemperatureChart data={history} showFumes />
      )}
    </div>
  );
}
