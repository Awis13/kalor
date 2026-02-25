"use client";

import { useStove } from "@/hooks/use-stove";
import { useStoveStore } from "@/store/stove-store";
import { AlarmBanner } from "@/components/alarms/alarm-banner";
import { TemperatureDisplay } from "@/components/dashboard/temperature-display";
import { TemperatureDial } from "@/components/dashboard/temperature-dial";
import { StoveStatusBadge } from "@/components/dashboard/stove-status-badge";
import { FumesDisplay } from "@/components/dashboard/fumes-display";
import { PowerToggle } from "@/components/dashboard/power-toggle";
import { PowerSelector } from "@/components/dashboard/power-selector";
import { Flame, Wind, Loader2 } from "lucide-react";

function ConnectingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 max-w-md mx-auto text-center min-h-[60vh]">
      <div className="relative">
        <Flame className="h-12 w-12 text-amber-500/30" />
        <Loader2 className="absolute inset-0 h-12 w-12 text-amber-500 animate-spin" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Connecting to stove...</h2>
        <p className="text-sm text-muted-foreground">
          Reaching cloud relay, reading sensors
        </p>
      </div>
      <div className="flex gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 max-w-md mx-auto text-center min-h-[60vh]">
      <div className="rounded-full bg-destructive/10 p-4">
        <Flame className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold">Connection Error</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        Will retry automatically every 12 seconds.
      </p>
      <button
        onClick={onRetry}
        className="mt-2 rounded-lg bg-amber-500 px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-400"
      >
        Retry Now
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { stove, error, sendCommand, isSending, pendingCommand } = useStove();
  const fetchStatus = useStoveStore((s) => s.fetchStatus);

  if (!stove && error) {
    return <ErrorState message={error} onRetry={fetchStatus} />;
  }

  if (!stove) {
    return <ConnectingState />;
  }

  return (
    <div className="flex flex-col gap-3 p-4 max-w-md mx-auto">
      {/* Аларм баннер */}
      {stove.hasAlarm && (
        <AlarmBanner
          alarmCode={stove.alarmCode}
          alarmText={stove.alarmText}
          hasAlarm={stove.hasAlarm}
        />
      )}

      {/* Температура комнаты */}
      <TemperatureDisplay
        roomTemp={stove.roomTemp}
        targetTemp={stove.targetTemp}
        isOn={stove.isOn}
      />

      {/* Регулятор целевой температуры */}
      <TemperatureDial
        value={stove.targetTemp}
        min={10}
        max={35}
        onChange={(temp) => sendCommand("set_temp", temp)}
      />

      {/* Статус + дым + вентилятор — в одну строку */}
      <div className="flex gap-2">
        <StoveStatusBadge status={stove.status} statusText={stove.statusText} />
        <FumesDisplay fumesTemp={stove.fumesTemp} />
        <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card p-3">
          <Wind className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-foreground">
            {stove.fanSpeed}
          </span>
          <span className="text-xs text-muted-foreground">RPM</span>
        </div>
      </div>

      {/* Вкл/выкл */}
      <PowerToggle
        isOn={stove.isOn}
        onToggle={() => sendCommand(stove.isOn ? "power_off" : "power_on")}
        isSending={isSending && (pendingCommand === "power_on" || pendingCommand === "power_off")}
      />

      {/* Мощность */}
      <PowerSelector
        value={stove.powerLevel}
        onChange={(level) => sendCommand("set_power", level)}
        isSending={isSending && pendingCommand === "set_power"}
      />
    </div>
  );
}
