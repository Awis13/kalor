"use client";

import { useState, useMemo } from "react";
import { useSchedule } from "@/hooks/use-schedule";
import { WeekGrid } from "@/components/schedule/week-grid";
import { TimeSlotEditor } from "@/components/schedule/time-slot-editor";
import { Plus } from "lucide-react";
import { DAYS_OF_WEEK } from "@/lib/agua-constants";
import type { ScheduleSlot, ScheduleDay } from "@/lib/agua-types";

export default function SchedulePage() {
  const { slots, addSlot, removeSlot, updateSlot } = useSchedule();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  // Конвертируем плоский массив слотов в ScheduleDay[] для WeekGrid
  const schedule: ScheduleDay[] = useMemo(() => {
    return DAYS_OF_WEEK.map((label, i) => ({
      dayOfWeek: i,
      label,
      slots: slots.filter((s) => s.dayOfWeek === i),
    }));
  }, [slots]);

  const handleAdd = () => {
    setEditingSlot(null);
    setEditorOpen(true);
  };

  const handleEdit = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setEditorOpen(true);
  };

  const handleSave = (slot: ScheduleSlot) => {
    if (editingSlot) {
      updateSlot(editingSlot.id, slot);
    } else {
      addSlot(slot);
    }
    setEditorOpen(false);
    setEditingSlot(null);
  };

  const handleCancel = () => {
    setEditorOpen(false);
    setEditingSlot(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold">Schedule</h1>

      <WeekGrid
        schedule={schedule}
        onEditSlot={handleEdit}
        onDeleteSlot={removeSlot}
      />

      {/* FAB */}
      <button
        onClick={handleAdd}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
        aria-label="Add schedule slot"
      >
        <Plus className="h-6 w-6" />
      </button>

      <TimeSlotEditor
        open={editorOpen}
        slot={editingSlot ?? undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
