// Offline demo mode.
// When NEXT_PUBLIC_KALOR_DEMO=1 (or KALOR_DEMO=1) is set, the status/command
// API routes return canned data instead of connecting to the cloud relay.
// This lets the dashboard render without a live stove — useful for screenshots
// and local development. It is opt-in and never affects the default behaviour.

import type { StoveState } from "./agua-types";

export function isDemoMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_KALOR_DEMO === "1" ||
    process.env.KALOR_DEMO === "1"
  );
}

// A realistic snapshot of a running stove (heating, no alarm).
export function getDemoStoveState(): StoveState {
  return {
    status: 4, // Working
    statusText: "Working",
    isOn: true,

    roomTemp: 21.5,
    targetTemp: 22,
    fumesTemp: 148,
    waterTemp: 0,

    powerLevel: 3,
    fanSpeed: 1250,

    waterPressure: 0,
    flamePower: 4,
    pelletLoadTime: 4,
    cpuCounter: 0,

    alarmCode: 0,
    alarmText: "No error",
    hasAlarm: false,

    isOnline: true,
    lastUpdate: Date.now(),

    rawRegisters: {
      status: 0x02000000,
      room_temp: 215,
      fumes_temp: 148,
      power_level: 3,
      pellet_speed: 4,
      exh_fan_rpm: 125,
      error: 0,
      setpoint: 22,
      room_temp_c: 21.5,
      fumes_temp_c: 148,
      exh_fan_rpm_actual: 1250,
    },
  };
}
