"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface TimeRangePickerProps {
  value: string;
  onChange: (v: string) => void;
}

const TIME_RANGES = [
  { value: "1H", label: "1H" },
  { value: "24H", label: "24H" },
  { value: "7D", label: "7D" },
  { value: "30D", label: "30D" },
] as const;

export function TimeRangePicker({ value, onChange }: TimeRangePickerProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v);
      }}
      variant="outline"
      size="sm"
    >
      {TIME_RANGES.map((range) => (
        <ToggleGroupItem
          key={range.value}
          value={range.value}
          className="px-3 text-xs data-[state=on]:bg-amber-500 data-[state=on]:text-white"
        >
          {range.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
