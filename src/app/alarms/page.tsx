"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ERROR_CODES } from "@/lib/duepi-constants";

interface AlarmEntry {
  code: number;
  text: string;
  timestamp: number;
}

const STORAGE_KEY = "kalor-alarms";

function loadAlarms(): AlarmEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function clearAlarms(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<AlarmEntry[]>([]);

  useEffect(() => {
    setAlarms(loadAlarms());
  }, []);

  const handleClear = () => {
    clearAlarms();
    setAlarms([]);
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Alarm History</h1>
        {alarms.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {alarms.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-card p-12 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No alarms recorded</p>
          <p className="text-xs text-muted-foreground">
            Alarm events will appear here when they occur.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alarms
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((alarm, idx) => (
              <Card key={`${alarm.timestamp}-${idx}`}>
                <CardContent className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 rounded-full bg-destructive/10 p-1.5">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {alarm.text ||
                          ERROR_CODES[alarm.code] ||
                          `Alarm ${alarm.code}`}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        Code {alarm.code}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(alarm.timestamp)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
