# Tech Skull Presence

Visual configurator and dashboard for the **MYumar.HP_series** family of DIY ESP32-C3 + mmWave presence sensors.

> Forked from [EverythingSmartHome/everything-presence-addons](https://github.com/EverythingSmartHome/everything-presence-addons) and adapted for the HP-series hardware variants. Original credit to the Everything Smart Home team.

## Supported devices

Auto-discovered as devices whose `esphome.project.name` starts with `MYumar.HP_series`:

| Device           | Radar    | Environmental    | Extras                       |
| :--------------- | :------- | :--------------- | :--------------------------- |
| HP-mini-1        | LD2410   | —                | BLE proxy                    |
| HP-01-Saladeestar| LD2410   | SCD40            | WS2812 CO2 LED, No-Disturb   |
| HP-01-Luz        | LD2410   | SCD40 + BH1750   | WS2812 CO2 LED               |
| HP-01-Ninos      | LD2410   | SCD40            | WS2812 LED + RTTTL buzzer    |
| HP-02-Lite       | LD2450   | —                | 2D rectangular zones         |

## Key features (in progress)

- **Device discovery** by `esphome.project.name = "MYumar.HP_series"`
- **Modular device profiles** that compose features (radar + env + UI) per prototype
- **Dual-mode zone editor** — 2D rectangles for LD2450, 1D distance bands for LD2410
- **Virtual rooms** — aggregate multiple physical devices in one logical space
- **Per-feature panels** — CO2 history, RTTTL melody tester, lux readings, No-Disturb global toggle

## Architecture

- `backend/` — Node.js + TypeScript Fastify server, Home Assistant REST/WebSocket transport
- `frontend/` — React + Vite + Tailwind SPA served as HA ingress panel
- `config/device-profiles/` — JSON files describing each HP-* variant's entities

## Development

```bash
npm install
npm run dev        # backend + frontend in parallel
npm run build
```

Requires Node 18+.
