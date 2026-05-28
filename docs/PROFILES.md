# Profile & Entity Reference

Every MYumar.HP_series device reports `manufacturer = MYumar` and `model = HP_series`.
The **profile** (a JSON file under `tech-skull-presence/config/device-profiles/`)
describes which entities each hardware variant exposes and how the add-on maps them.

Entity IDs below use `${name}` as the device's entity prefix
(e.g. `hp_01_saladeestar`). So `binary_sensor.${name}_presence` →
`binary_sensor.hp_01_saladeestar_presence`.

---

## Capability matrix

| Capability            | mini | saladeestar | luz | ninos | lite |
| :-------------------- | :--: | :---------: | :-: | :---: | :--: |
| mmWave presence       |  ✅  |     ✅      | ✅  |  ✅   |  ✅  |
| Distance-only (1D)    |  ✅  |     ✅      | ✅  |  ✅   |  —   |
| 2D tracking (X/Y)     |  —   |     —       | —   |  —    |  ✅  |
| Rectangular zones     |  —¹  |     —¹      | —¹  |  —¹   |  ✅  |
| CO2 / temp / humidity |  —   |     ✅      | ✅  |  ✅   |  —   |
| Illuminance           |  —   |     —       | ✅  |  —    |  —   |
| WS2812 CO2 LED        |  —   |     ✅      | ✅  |  ✅   |  —   |
| RTTTL buzzer          |  —   |     —       | —   |  ✅   |  —   |

¹ LD2410 devices use **1D distance bands** instead of 2D rectangles.

---

## myumar_hp_mini (LD2410)

| Key                  | Entity                                   | Category | Required |
| :------------------- | :--------------------------------------- | :------- | :------: |
| presence             | `binary_sensor.${name}_presence`         | sensor   |   yes    |
| movingPresence       | `binary_sensor.${name}_moving_presence`  | sensor   |    no    |
| stillPresence        | `binary_sensor.${name}_still_presence`   | sensor   |    no    |
| distance             | `sensor.${name}_detection_distance`      | tracking |    no    |
| lastDetectionDistance| `sensor.${name}_last_detection_distance` | sensor   |    no    |
| zone1/2/3 Occupancy  | `binary_sensor.${name}_zone_N_occupancy` | sensor   |    no    |
| zone1/2/3 EndDistance| `number.${name}_zone_N_end_distance`     | setting  |    no    |
| timeout              | `number.${name}_timeout`                 | setting  |    no    |
| lightThreshold       | `number.${name}_light_threshold`         | setting  |    no    |
| maxMove/StillGate    | `number.${name}_max_(move\|still)_distance_gate` | setting | no |
| engineeringMode      | `switch.${name}_engineering_mode`        | setting  |    no    |
| controlBluetooth     | `switch.${name}_control_bluetooth`       | setting  |    no    |

## myumar_hp_saladeestar (LD2410 + SCD40 + LED)

Everything in `mini`, **except** `presence` maps to `binary_sensor.${name}_room_occupancy`
(the bare `_presence` is exposed as `rawPresence`), plus:

| Key                | Entity                                   | Category |
| :----------------- | :--------------------------------------- | :------- |
| co2                | `sensor.${name}_scd40_co2`               | sensor   |
| co2Trend           | `sensor.${name}_co2_trend`               | sensor   |
| temperature        | `sensor.${name}_co2_temperature`         | sensor   |
| humidity           | `sensor.${name}_co2_humidity`            | sensor   |
| co2Led             | `light.${name}_co2_led`                  | setting  |
| noDisturbMode      | `switch.${name}_no_disturb_mode`         | setting  |
| scd40TempOffset    | `number.${name}_scd40_temperature_offset`| setting  |
| scd40HumidityOffset| `number.${name}_scd40_humidity_offset`   | setting  |

## myumar_hp_luz (LD2410 + SCD40 + BH1750 + LED)

Everything in `saladeestar`, plus:

| Key          | Entity                          | Category |
| :----------- | :------------------------------ | :------- |
| illuminance  | `sensor.${name}_illuminance`    | sensor   |
| ldrThreshold | `number.${name}_ldr_threshold`  | setting  |

## myumar_hp_ninos (LD2410 + SCD40 + LED + buzzer)

Entities are **identical to `saladeestar`** — the RTTTL buzzer is driven by
on-device scripts and test buttons that don't expose a unique sensor entity.
Choose this profile manually if you want the (planned) buzzer melody panel.

## myumar_hp_lite (LD2450, 2D)

| Key                       | Entity                                       | Category | Notes                        |
| :------------------------ | :------------------------------------------- | :------- | :--------------------------- |
| presence                  | `binary_sensor.${name}_presence`             | sensor   | required                     |
| movingTarget / stillTarget| `binary_sensor.${name}_(moving\|still)_target`| sensor  |                              |
| targetCount               | `sensor.${name}_presence_target_count`       | tracking |                              |
| target1/2/3 X,Y,…         | `sensor.${name}_target_N_(x\|y\|distance\|speed\|angle\|resolution)` | tracking | up to 3 targets |
| zone1/2/3 corners         | `number.${name}_zone_N_(x1\|y1\|x2\|y2)`     | zone     | → beginX/beginY/endX/endY    |
| zone1/2/3 target counts   | `sensor.${name}_zone_N_(all\|still\|moving)_target_count` | sensor |                  |
| timeout                   | `number.${name}_timeout`                     | setting  |                              |
| radarZoneMode             | `select.${name}_radar_modo_zonas`            | setting  | Disabled/Detection/Filter    |
| radarBaudRate             | `select.${name}_radar_baud_rate`             | setting  |                              |
| radarBluetooth            | `switch.${name}_radar_bluetooth`             | setting  |                              |
| multiTargetTracking       | `switch.${name}_radar_multi_target_tracking` | setting  |                              |

---

## How auto-detection picks a profile

`GET /api/devices/:deviceId/suggest-profile` scores every profile:

```
score = requiredRatio × 1000 + matchedOptional × 10 − optionalMissing
```

- A profile missing any **required** entity is effectively disqualified.
- Among valid profiles, the one matching the **most optional** entities wins
  (so `luz` beats `saladeestar` when illuminance is present).
- A small penalty for optional entities the device lacks breaks ties toward the
  **tightest fit**.

`saladeestar` and `ninos` always tie (identical entities) — auto-detection may
pick either; choose `ninos` manually for the buzzer.
