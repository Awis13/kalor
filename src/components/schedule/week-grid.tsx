"use client";

import { useCallback, useRef } from "react";
import { Trash2 } from "lucide-react";
import type { ScheduleDay, ScheduleSlot } from "@/lib/agua-types";
import { DAYS_OF_WEEK } from "@/lib/agua-constants";
import { cn } from "@/lib/utils";

interface WeekGridProps {
  schedule: ScheduleDay[];
  onEditSlot: (slot: ScheduleSlot) => void;
  onDeleteSlot: (id: string) => void;
}

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

function SlotBlock({
  slot,
  onEdit,
  onDelete,
}: {
  slot: ScheduleSlot;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onDelete();
    }, 600);
  }, [onDelete]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!isLongPress.current) {
      onEdit();
    }
  }, [onEdit]);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Рассчитываем ширину блока (пропорционально 24 часам)
  const startFrac =
    (slot.startHour + slot.startMinute / 60) / 24;
  const endFrac =
    (slot.endHour + slot.endMinute / 60) / 24;
  const widthPct = Math.max((endFrac - startFrac) * 100, 4);
  const leftPct = startFrac * 100;

  return (
    <div
      className={cn(
        "absolute top-0.5 bottom-0.5 flex items-center justify-center rounded text-[9px] font-medium cursor-pointer select-none",
        slot.enabled
          ? "bg-amber-500/30 border border-amber-500/50 text-amber-300"
          : "bg-muted/50 border border-border text-muted-foreground"
      )}
      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={onEdit}
    >
      <span className="truncate px-0.5">
        {formatTime(slot.startHour, slot.startMinute)}
      </span>
      {/* Кнопка удаления для десктопа */}
      <button
        className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex hover:bg-red-600 md:flex"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

export function WeekGrid({ schedule, onEditSlot, onDeleteSlot }: WeekGridProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Заголовок с часами */}
      <div className="flex items-center gap-2">
        <div className="w-10 shrink-0" />
        <div className="relative flex-1">
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
        </div>
      </div>

      {/* Строки дней */}
      {DAYS_OF_WEEK.map((dayName, dayIndex) => {
        const day = schedule.find((d) => d.dayOfWeek === dayIndex);
        const slots = day?.slots ?? [];

        return (
          <div key={dayIndex} className="group flex items-center gap-2">
            <span className="w-10 shrink-0 text-right text-[10px] font-medium text-muted-foreground">
              {dayName.slice(0, 3)}
            </span>
            <div className="relative h-7 flex-1 overflow-hidden rounded bg-muted/30">
              {slots.map((slot) => (
                <SlotBlock
                  key={slot.id}
                  slot={slot}
                  onEdit={() => onEditSlot(slot)}
                  onDelete={() => onDeleteSlot(slot.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
