"use client";

import { useState, useEffect } from "react";
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
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(22);
  const [endMinute, setEndMinute] = useState(0);
  const [targetTemp, setTargetTemp] = useState(21);
  const [powerLevel, setPowerLevel] = useState(3);

  // Заполняем форму при редактировании существующего слота
  useEffect(() => {
    if (slot) {
      setDayOfWeek(slot.dayOfWeek);
      setStartHour(slot.startHour);
      setStartMinute(slot.startMinute);
      setEndHour(slot.endHour);
      setEndMinute(slot.endMinute);
      setTargetTemp(slot.targetTemp);
      setPowerLevel(slot.powerLevel);
    } else {
      // Значения по умолчанию для нового слота
      setDayOfWeek(0);
      setStartHour(8);
      setStartMinute(0);
      setEndHour(22);
      setEndMinute(0);
      setTargetTemp(21);
      setPowerLevel(3);
    }
  }, [slot, open]);

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
          {/* Выбор дня */}
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

          {/* Время начала и конца */}
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

          {/* Целевая температура */}
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

          {/* Уровень мощности */}
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
