# MYumar.HP_series — ESPHome Firmware

ESPHome configurations for the HP-series DIY presence sensors. All declare
`esphome.project.name: "MYumar.HP_series"` so Home Assistant reports them under
manufacturer **MYumar**, which is how the
[Tech Skull Presence](../tech-skull-presence) add-on discovers them.

## Devices

| File                      | Device name        | Radar  | Environmental    | Extras                     | Add-on profile           |
| :------------------------ | :----------------- | :----- | :--------------- | :------------------------- | :----------------------- |
| `hp-mini-1.yaml`          | hp-mini-1          | LD2410 | —                | BLE proxy                  | `myumar_hp_mini`         |
| `hp-01-saladeestar.yaml`  | hp-01-saladeestar  | LD2410 | SCD40            | WS2812 CO2 LED, No-Disturb | `myumar_hp_saladeestar`  |
| `hp-01-luz.yaml`          | hp-01-luz          | LD2410 | SCD40 + BH1750   | WS2812 CO2 LED             | `myumar_hp_luz`          |
| `hp-01-ninos.yaml`        | hp-01-ninos        | LD2410 | SCD40            | WS2812 LED + RTTTL buzzer  | `myumar_hp_ninos`        |
| `hp-02-lite.yaml`         | hp-02-lite         | LD2450 | —                | 2D rectangular zones       | `myumar_hp_lite`         |
| `hp-02-lite-2.yaml`       | hp-02-lite-2       | LD2450 | —                | 2D rectangular zones       | `myumar_hp_lite`         |

> `hp-02-lite.yaml` and `hp-02-lite-2.yaml` are **identical except for device
> identity** (name + secrets). Same hardware → same firmware → same add-on
> profile, demonstrating that one profile serves many devices.

## Secrets

These firmwares reference secrets via `!secret`. Before flashing:

1. Copy [`secrets.yaml.example`](secrets.yaml.example) to `secrets.yaml` in your
   ESPHome directory.
2. Fill in your Wi-Fi credentials and per-device API/OTA keys.

Your real `secrets.yaml` is **git-ignored** and must never be committed.

## Flashing

Open each YAML in the ESPHome dashboard (or `esphome run <file>.yaml`) and install.
After flashing, the device appears in Home Assistant via the ESPHome integration,
and the add-on auto-discovers it.
