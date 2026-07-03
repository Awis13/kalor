"use client";

import { useState } from "react";
import type { ScheduleSlot } from "@/lib/agua-types";
import { DAYS_OF_WEEK } from "@/lib/agua-constants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface TimeSlotEditorProps {
  slot?: ScheduleSlot;
  onSave: (slot: ScheduleSlot) => void;
  onCancel: () => void;
  open: boolean;
}

function generateId(): string {
  return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function TimeSlotEditor({
  slot,
  onSave,
  onCancel,
  open,
}: TimeSlotEditorProps) {
  // Initial state is derived from the slot prop. The parent remounts this
  // component (via a key) whenever the slot or open state changes, so the
  // form always starts from the right values.
  const [dayOfWeek, setDayOfWeek] = useState(slot?.dayOfWeek ?? 0);
  const [startHour, setStartHour] = useState(slot?.startHour ?? 8);
  const [startMinute, setStartMinute] = useState(slot?.startMinute ?? 0);
  const [endHour, setEndHour] = useState(slot?.endHour ?? 22);
  const [endMinute, setEndMinute] = useState(slot?.endMinute ?? 0);
  const [targetTemp, setTargetTemp] = useState(slot?.targetTemp ?? 21);
  const [powerLevel, setPowerLevel] = useState(slot?.powerLevel ?? 3);

  const handleSave = () => {
    onSave({
      id: slot?.id ?? generateId(),
      dayOfWeek,
      startHour,
      startMinute,
      endHour,
      endMinute,
      targetTemp,
      powerLevel,
      enabled: slot?.enabled ?? true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{slot ? "Edit Time Slot" : "New Time Slot"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Day selector */}
          <div className="flex flex-col gap-2">
            <Label>Day</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((day, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={dayOfWeek === i ? "default" : "outline"}
                  onClick={() => setDayOfWeek(i)}
                  className={
                    dayOfWeek === i
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : ""
                  }
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          {/* Start and end time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={`${startHour.toString().padStart(2, "0")}:${startMinute
                  .toString()
                  .padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setStartHour(h);
                  setStartMinute(m);
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={`${endHour.toString().padStart(2, "0")}:${endMinute
                  .toString()
                  .padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setEndHour(h);
                  setEndMinute(m);
                }}
              />
            </div>
          </div>

          {/* Target temperature */}
          <div className="flex flex-col gap-2">
            <Label>
              Target Temperature:{" "}
              <span className="text-amber-400">{targetTemp}°C</span>
            </Label>
            <Slider
              value={[targetTemp]}
              onValueChange={([v]) => setTargetTemp(v)}
              min={10}
              max={35}
              step={0.5}
            />
          </div>

          {/* Power level */}
          <div className="flex flex-col gap-2">
            <Label>Power Level</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  size="sm"
                  variant={powerLevel === level ? "default" : "outline"}
                  onClick={() => setPowerLevel(level)}
                  className={
                    powerLevel === level
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : ""
                  }
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
