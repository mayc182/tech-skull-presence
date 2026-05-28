# Troubleshooting

## Devices not discovered

The add-on lists devices whose Home Assistant **manufacturer** is `MYumar`. That
value comes from the firmware's `esphome.project.name`:

```yaml
esphome:
  project:
    name: "MYumar.HP_series"   # left of the dot = manufacturer (MYumar)
    version: "1.0.0"
```

Checklist:
1. The firmware was flashed **with** this block.
2. The device is added through the **ESPHome integration** in HA.
3. After flashing, reload the ESPHome integration entry (or restart HA) so the
   manufacturer is refreshed in the device registry.

Verify in HA: **Settings → Devices & Services → Devices →** open the device →
the manufacturer should read `MYumar`.

## Wrong profile assigned

Auto-detection arrived in v0.1.2. If a device shows the wrong profile:
1. Update the add-on to ≥ 0.1.2.
2. Re-run the wizard for that device, or open the device settings and **Re-sync
   entities** — the suggested profile is recomputed from the device's entities.

The only inherent ambiguity is **Saladeestar vs Niños** (identical entities). Pick
`myumar_hp_ninos` manually if you want the buzzer features.

## A required entity is "unmatched" or shows a "conflict"

- **Re-sync entities** first.
- Suffix collisions (e.g. `_presence` vs `_moving_presence`) are auto-resolved
  since v0.1.1 by preferring the shortest matching entity. If you're on an older
  build, update.
- If an entity is genuinely missing, confirm it isn't **disabled** in HA
  (Settings → Devices → device → entity → enable), then re-sync.

## Distance Bands panel doesn't appear (LD2410 devices)

The panel needs all three of `number.${name}_zone_1_end_distance`,
`_zone_2_end_distance`, `_zone_3_end_distance` mapped. Re-sync entities; make sure
those template numbers exist and are enabled on the device.

## 2D zone editor is empty (HP-Lite / LD2450)

The editor needs the zone corner numbers `zone_1_x1 … zone_3_y2`. In ESPHome these
come from the LD2450 `number:` block. Confirm they're enabled in HA, then re-sync.
Targets only render when someone is in view of the radar.

## Live values look wrong / in the wrong unit

Distance from the LD2410 is reported in **cm**; the dashboard converts as needed.
If a value seems off by ×100, check the entity's `unit_of_measurement` in HA — it
should be `cm` for distance entities.

## "No firmware available" in the firmware panel

Expected. The upstream firmware-update flow points at Everything Presence firmware
indexes, which don't host HP firmware. Flash your devices through ESPHome as usual.
A hosted HP firmware index may come in a later version.

## Add-on won't build / install

- Supported architectures: `aarch64`, `amd64`, `armv7`.
- Read the **add-on log** during install — the failing Docker step is shown.
- A common cause is an out-of-sync `package-lock.json` after editing
  `package.json`; the lock file must match (run `npm install` locally and commit
  the updated lock).

## Where is my data stored?

Rooms, zones, mappings and settings live in `/config/tech-skull-presence` on the
HA host, so they survive add-on updates and reinstalls. Delete that folder to
start fresh.

## Getting logs

**Settings → Add-ons → Tech Skull Presence → Log**. Increase verbosity by setting
the add-on/system log level if needed. Backend logs are JSON lines tagged
`tech-skull-presence-backend`.
