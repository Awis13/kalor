"use client";

import { useStove } from "@/hooks/use-stove";
import { useStoveHistory } from "@/hooks/use-stove-history";
import { TelemetryGrid } from "@/components/telemetry/telemetry-grid";
import { MultiChart } from "@/components/telemetry/multi-chart";
import { RawRegistersTable } from "@/components/telemetry/raw-registers-table";
import { Loader2, Activity } from "lucide-react";

export default function TelemetryPage() {
  const { stove } = useStove();
  const { history } = useStoveHistory();

  if (!stove) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 max-w-md mx-auto text-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Connecting to stove...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold">Telemetry</h1>

      {/* Сетка gauge-карточек */}
      <TelemetryGrid registers={stove.rawRegisters} />

      {/* Мультиграфик с переключением серий */}
      <MultiChart data={history} />

      {/* Сырые регистры */}
      <RawRegistersTable registers={stove.rawRegisters} />
    </div>
  );
}
