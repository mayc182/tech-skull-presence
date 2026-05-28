# MYumar HP Series Add-ons

Home Assistant add-ons for the **MYumar.HP_series** DIY presence sensors.

## Quick install

Click the button below to add this repository to your Home Assistant instance, then install **Tech Skull Presence**:

[![Open your Home Assistant instance and add this add-on repository.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fmayc182%2Ftech-skull-presence)

> If the button doesn't work: **Settings → Add-ons → Add-on Store → ⋮ → Repositories**, then paste `https://github.com/mayc182/tech-skull-presence`.

## About

Visual configuration and dashboard add-ons for a family of ESP32-C3 based presence sensors built around LD2410 (1D distance) and LD2450 (2D positioning) mmWave radars, optionally combined with SCD40 (CO2/temp/humidity), BH1750 (illuminance), WS2812 LED feedback, and RTTTL buzzer alerts.

The firmwares share an `esphome.project.name: "MYumar.HP_series"` identifier so Home Assistant treats them as a family and this add-on discovers them automatically.

## Add-ons in this repository

### Tech Skull Presence

Visual configurator and dashboard for HP-series devices. See [`tech-skull-presence/`](tech-skull-presence/) for details.

## Install on Home Assistant OS

1. **Settings → Add-ons → Add-on store**
2. Top-right menu → **Repositories**
3. Add: `https://github.com/mayc182/tech-skull-presence`
4. Install **Tech Skull Presence** from the new repository section.

## Credits

Forked from [EverythingSmartHome/everything-presence-addons](https://github.com/EverythingSmartHome/everything-presence-addons) — adapted for the MYumar.HP_series DIY firmware family.
