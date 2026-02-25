# TODO — Kalor Stove Controller

## Up Next
- [ ] Rename `agua-types.ts` → `types.ts`, `agua-constants.ts` → `constants.ts` — no longer Agua IOT, purely Duepi protocol now (small)
- [ ] Implement alarm recording — `use-stove-history.ts` records temps but never saves alarm events (medium)
- [ ] Add error boundary — wrap app in React error boundary so crash doesn't brick the PWA (small)

## Backlog
- [ ] API route authentication — currently wide open. Add a simple API key or session check (medium)
- [ ] Extract shared SVG helpers — `polarToCartesian`, `describeArc` duplicated between dial and gauge (small)
- [ ] Add `"server-only"` import to `session.ts` and `duepi-client.ts` — prevent accidental client import (small)

## Done
- [x] C1: Temperature dial debounce — was flooding API on every drag pixel. Now uses local `dragValue`, only sends `onChange` on release (2026-02-25)
- [x] C2: Removed dead `set_fan` command — was calling `setPowerLevel` incorrectly (2026-02-25)
- [x] C3: Fixed duplicate socket error listeners in `duepi-client.ts` — merged into one handler (2026-02-25)
- [x] C4: Device code validation — `getDuepiClient()` now throws if `DUEPI_DEVICE_CODE` not set (2026-02-25)
- [x] I5: Fixed optimistic state race — `fetchStatus` only clears optimistic when no `pendingCommand` in flight (2026-02-25)
- [x] I6: Added input validation — `set_temp` clamped 10-35, `set_power` clamped 0-6 in API route (2026-02-25)
- [x] I3: Merged duplicate alarm tables — removed `ALARM_CODES` from `agua-constants.ts`, alarms page now uses `ERROR_CODES` from `duepi-constants.ts` (2026-02-25)
- [x] I7: Removed dead dependencies — `socket.io-client`, `ws`, `uuid`, `next-themes`, `@types/uuid` (2026-02-25)
- [x] I2 (partial): Deleted dead Agua IOT types — `AguaConfig`, `AuthTokens`, `AguaDevice`, etc. (2026-02-25)
- [x] Fixed `sonner.tsx` — hardcoded `theme="dark"` instead of `next-themes` dependency (2026-02-25)
