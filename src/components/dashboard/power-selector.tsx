"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PowerSelectorProps {
  value: number;
  onChange: (v: number) => void;
  isSending?: boolean;
  disabled?: boolean;
}

const POWER_LEVELS = [1, 2, 3, 4, 5];

export function PowerSelector({
  value,
  onChange,
  isSending = false,
  disabled = false,
}: PowerSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Power
        </span>
        {isSending && (
          <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
        )}
      </div>
      <div className="flex gap-2">
        {POWER_LEVELS.map((level) => (
          <Button
            key={level}
            size="sm"
            variant={value === level ? "default" : "outline"}
            disabled={disabled || isSending}
            onClick={() => onChange(level)}
            className={cn(
              "h-9 w-9 p-0 transition-all",
              value === level &&
                "bg-amber-500 text-white hover:bg-amber-600 border-amber-500",
              isSending && "opacity-60"
            )}
          >
            {level}
          </Button>
        ))}
      </div>
    </div>
  );
}
