"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useStoveStore } from "@/store/stove-store";
import { Trash2, Info, Gauge, Cpu } from "lucide-react";
import { toast } from "sonner";

const APP_VERSION = "0.1.0";

interface DeviceInfo {
  name: string;
  product_name: string;
  product_serial: string;
  is_online: boolean;
}

export default function SettingsPage() {
  const pollInterval = useStoveStore((s) => s.pollInterval);
  const setPollInterval = useStoveStore((s) => s.setPollInterval);

  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [isLoadingDevice, setIsLoadingDevice] = useState(false);

  // Интервал поллинга в секундах для UI
  const pollSec = Math.round(pollInterval / 1000);

  // Загрузка информации об устройстве
  useEffect(() => {
    async function fetchDevice() {
      setIsLoadingDevice(true);
      try {
        const res = await fetch("/api/stove/devices");
        if (res.ok) {
          const data = await res.json();
          if (data.devices && data.devices.length > 0) {
            setDevice(data.devices[0]);
          }
        }
      } catch {
        // Не критично — просто не покажем инфо
      } finally {
        setIsLoadingDevice(false);
      }
    }
    fetchDevice();
  }, []);

  // Очистка истории (IndexedDB + localStorage)
  const handleClearHistory = async () => {
    try {
      // Очищаем IndexedDB
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name?.includes("kalor")) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
      // Очищаем алармы из localStorage
      localStorage.removeItem("kalor-alarms");
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold">Settings</h1>

      {/* Poll interval */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Gauge className="h-4 w-4 text-primary" />
            Poll Interval
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              How often to fetch stove data
            </span>
            <span className="text-sm font-medium tabular-nums">
              {pollSec}s
            </span>
          </div>
          <Slider
            value={[pollSec]}
            min={5}
            max={30}
            step={1}
            onValueChange={([val]) => setPollInterval(val * 1000)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>5s</span>
            <span>30s</span>
          </div>
        </CardContent>
      </Card>

      {/* Device info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Cpu className="h-4 w-4 text-primary" />
            Device Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDevice ? (
            <div className="flex flex-col gap-2 animate-pulse">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-4 w-40 rounded bg-muted" />
            </div>
          ) : device ? (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{device.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium">{device.product_name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serial</span>
                <span className="font-mono text-xs">
                  {device.product_serial}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={
                    device.is_online ? "text-green-500" : "text-red-500"
                  }
                >
                  {device.is_online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Could not load device information.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Clear history */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleClearHistory}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All History
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Removes all stored temperature history and alarm logs.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4 text-primary" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">App</span>
              <span className="font-medium">Kalor</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono text-xs">{APP_VERSION}</span>
            </div>
            <Separator />
            <p className="pt-1 text-xs text-muted-foreground">
              Pellet stove controller for Kalor Petit via Duepi EVO cloud
              relay. Replaces the DP Remote app.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
