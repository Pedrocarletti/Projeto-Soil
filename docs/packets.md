# Telemetry Packet Contract

The challenge references a complementary packet document, but it was not available in this workspace. This implementation therefore adopts the packet below as the local contract for MQTT and HTTP ingest.

```json
{
  "pivotCode": "pivot-norte",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "isOn": true,
  "direction": "clockwise",
  "isIrrigating": true,
  "angle": 45,
  "percentimeter": 55,
  "source": "device"
}
```

Rules implemented by the backend:

- A packet with `isOn=true` opens a new `State` when none is active.
- Packets received while a `State` is active append `Cycle` entries.
- A packet with `isOn=false` closes the active `State`.
- `Pivot.status` is always overwritten with the latest packet.
